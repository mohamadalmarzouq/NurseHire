import asyncio
import os
from typing import Any, Dict, List

from dotenv import load_dotenv
from loguru import logger

from pipecat.frames.frames import EndFrame, TTSSpeakFrame, TranscriptionFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor
from pipecat.runner.types import RunnerArguments
from pipecat.runner.utils import create_transport
from pipecat.services.deepgram.stt import DeepgramSTTService
from pipecat.services.elevenlabs.tts import ElevenLabsTTSService
from pipecat.transports.base_transport import BaseTransport, TransportParams
from pipecat.transports.daily.transport import DailyParams

load_dotenv(override=True)


def normalize_questions(payload: Dict[str, Any]) -> List[str]:
    raw = payload.get("questions")
    if isinstance(raw, list):
        cleaned = [str(item.get("text") if isinstance(item, dict) else item).strip() for item in raw]
        return [item for item in cleaned if item]

    script = payload.get("script")
    if isinstance(script, str):
        items = [line.strip() for line in script.splitlines() if line.strip()]
        return items

    return []


class InterviewManager(FrameProcessor):
    def __init__(self, questions: List[str], max_silence_seconds: int = 8, max_retries: int = 2):
        super().__init__()
        self.questions = questions
        self.max_silence_seconds = max_silence_seconds
        self.max_retries = max_retries
        self._answer_event = asyncio.Event()
        self._last_answer: str | None = None
        self._task: asyncio.Task | None = None
        self._stopping = False

    async def start(self):
        if self._task is None:
            self._task = asyncio.create_task(self._run())

    async def stop(self):
        self._stopping = True
        if self._task:
            self._task.cancel()

    async def _run(self):
        if not self.questions:
            await self.push_frame(
                TTSSpeakFrame("No interview questions were provided."), FrameDirection.DOWNSTREAM
            )
            await self.push_frame(EndFrame(), FrameDirection.DOWNSTREAM)
            return

        await self.push_frame(
            TTSSpeakFrame("Hello. The AI interview will begin now."), FrameDirection.DOWNSTREAM
        )

        for question in self.questions:
            if self._stopping:
                break
            await self._ask_question(question)

        await self.push_frame(
            TTSSpeakFrame("Thank you. The interview is complete."), FrameDirection.DOWNSTREAM
        )
        await self.push_frame(EndFrame(), FrameDirection.DOWNSTREAM)

    async def _ask_question(self, question: str):
        retries = 0
        answer_text = None

        while retries <= self.max_retries and not self._stopping:
            self._answer_event.clear()
            await self.push_frame(TTSSpeakFrame(question), FrameDirection.DOWNSTREAM)

            try:
                await asyncio.wait_for(self._answer_event.wait(), timeout=self.max_silence_seconds)
                answer_text = self._last_answer
                self._last_answer = None
                break
            except asyncio.TimeoutError:
                retries += 1
                if retries <= self.max_retries:
                    await self.push_frame(
                        TTSSpeakFrame(f"I didn't catch that. {question}"),
                        FrameDirection.DOWNSTREAM,
                    )

        if answer_text:
            logger.info("Answer captured: {}", answer_text)
        else:
            logger.info("No response captured for question: {}", question)

    async def process_frame(self, frame, direction: FrameDirection):
        await super().process_frame(frame, direction)

        if isinstance(frame, TranscriptionFrame) and frame.finalized:
            self._last_answer = frame.text
            self._answer_event.set()

        await self.push_frame(frame, direction)


async def run_bot(transport: BaseTransport, runner_args: RunnerArguments):
    payload = runner_args.body or {}
    questions = normalize_questions(payload)
    voice_id = payload.get("voiceId") or os.getenv("ELEVENLABS_VOICE_ID")

    stt = DeepgramSTTService(api_key=os.getenv("DEEPGRAM_API_KEY"))
    tts = ElevenLabsTTSService(
        api_key=os.getenv("ELEVENLABS_API_KEY"),
        voice_id=voice_id,
        model="eleven_multilingual_v2",
    )

    interview_manager = InterviewManager(
        questions=questions,
        max_silence_seconds=int(payload.get("maxSilenceSeconds", 8)),
        max_retries=int(payload.get("maxRetries", 2)),
    )

    pipeline = Pipeline(
        [
            transport.input(),
            stt,
            interview_manager,
            tts,
            transport.output(),
        ]
    )

    task = PipelineTask(
        pipeline,
        params=PipelineParams(enable_metrics=True, enable_usage_metrics=True),
    )

    @transport.event_handler("on_first_participant_joined")
    async def on_first_participant_joined(transport, participant):
        await interview_manager.start()

    @transport.event_handler("on_participant_left")
    async def on_participant_left(transport, participant, reason):
        await interview_manager.stop()
        await task.cancel()

    runner = PipelineRunner(handle_sigint=runner_args.handle_sigint)
    await runner.run(task)


async def bot(runner_args: RunnerArguments):
    transport_params = {
        "daily": lambda: DailyParams(audio_in_enabled=True, audio_out_enabled=True),
        "webrtc": lambda: TransportParams(audio_in_enabled=True, audio_out_enabled=True),
    }
    transport = await create_transport(runner_args, transport_params)
    await run_bot(transport, runner_args)


if __name__ == "__main__":
    import pipecat.runner.run as runner

    # Bind to all interfaces for Pipecat Cloud readiness checks.
    runner.RUNNER_HOST = "0.0.0.0"
    runner.RUNNER_PORT = int(os.environ.get("PORT", "7860"))

    runner.main()
