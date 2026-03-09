export type AsyncJobRunnerOptions<TCreateResponse, TStatusResponse, TResult> = {
  createJob: () => Promise<TCreateResponse>;
  getJobId: (createResponse: TCreateResponse) => string | null;
  getImmediateResult?: (createResponse: TCreateResponse) => Promise<TResult | null> | TResult | null;
  fetchStatus: (jobId: string, attempt: number) => Promise<TStatusResponse>;
  getStatusResult: (statusResponse: TStatusResponse, jobId: string) => Promise<TResult | null> | TResult | null;
  hasFailedStatus?: (statusResponse: TStatusResponse, jobId: string) => boolean;
  getFailureMessage?: (statusResponse: TStatusResponse, jobId: string) => string;
  maxPollAttempts: number;
  pollIntervalMs: number;
  delayBeforeFirstPoll?: boolean;
  missingJobIdError: string;
  timeoutError: (jobId: string) => string;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function runAsyncJob<TCreateResponse, TStatusResponse, TResult>(
  options: AsyncJobRunnerOptions<TCreateResponse, TStatusResponse, TResult>,
): Promise<TResult> {
  const createResponse = await options.createJob();

  if (options.getImmediateResult) {
    const immediateResult = await options.getImmediateResult(createResponse);
    if (immediateResult) {
      return immediateResult;
    }
  }

  const jobId = options.getJobId(createResponse);
  if (!jobId) {
    throw new Error(options.missingJobIdError);
  }

  for (let attempt = 0; attempt < options.maxPollAttempts; attempt += 1) {
    if (options.delayBeforeFirstPoll || attempt > 0) {
      await sleep(options.pollIntervalMs);
    }

    const statusResponse = await options.fetchStatus(jobId, attempt);
    const result = await options.getStatusResult(statusResponse, jobId);
    if (result) {
      return result;
    }

    if (options.hasFailedStatus?.(statusResponse, jobId)) {
      const failureMessage = options.getFailureMessage?.(statusResponse, jobId);
      throw new Error(failureMessage || `Generation failed for job ${jobId}.`);
    }
  }

  throw new Error(options.timeoutError(jobId));
}
