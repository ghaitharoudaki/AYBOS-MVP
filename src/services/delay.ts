// Artificial latency utility to simulate real asynchronous API roundtrips
export const delay = (ms: number = 75): Promise<void> => 
  new Promise((resolve) => setTimeout(resolve, ms));
