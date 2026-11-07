import { analyzeCorpus } from "./analyzeCorpus.js";
self.onmessage = ({ data }) => {
  try {
    self.postMessage({ result: analyzeCorpus(data) });
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};
