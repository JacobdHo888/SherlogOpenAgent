import React, { useState, useEffect } from 'react';
import { X, Play, CheckCircle2, XCircle, RefreshCw, Terminal } from 'lucide-react';
import { runAllTests, ComprehensiveTestReport } from '../../tests/run-all-tests';

interface TestRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestRunnerModal: React.FC<TestRunnerModalProps> = ({ isOpen, onClose }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<ComprehensiveTestReport | null>(null);

  const executeTests = async () => {
    setIsRunning(true);
    try {
      const result = await runAllTests();
      setReport(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    if (isOpen && !report) {
      executeTests();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150 font-mono">
      <div className="bg-[#14161b] border border-[#383c48] rounded max-w-2xl w-full shadow-2xl overflow-hidden text-[#f2efe9]">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-[#23262f] bg-[#0f1013]">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#f2efe9]">
              Sherlog Automated Test Execution
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-[#9c9990] hover:text-[#f2efe9] hover:bg-[#20222a] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
          <div className="flex items-center justify-between bg-[#0e0f13] p-3 rounded border border-[#272a33]">
            <div>
              <div className="text-[#9c9990] text-[10px] uppercase">CLI Invocation:</div>
              <div className="text-amber-400 font-bold mt-0.5">npm run test</div>
            </div>

            <button
              onClick={executeTests}
              disabled={isRunning}
              className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>RUNNING...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>RE-RUN SUITES</span>
                </>
              )}
            </button>
          </div>

          {report && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs">
                <span
                  className={`px-2 py-0.5 rounded font-bold border ${
                    report.allPassed
                      ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                      : 'bg-red-950/80 border-red-700 text-red-300'
                  }`}
                >
                  {report.allPassed ? '3/3 SUITES PASSED' : 'FAILURES DETECTED'}
                </span>
                <span className="text-[#9c9990]">
                  {report.passedSuites} of {report.totalSuites} passed
                </span>
                <span className="text-[#363942]">/</span>
                <span className="text-[#67655e]">{new Date(report.timestamp).toLocaleTimeString()}</span>
              </div>

              <div className="space-y-2">
                {report.suites.map((suite, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded bg-[#0e0f13] border border-[#22252e] space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {suite.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                        <span className="font-semibold text-[#f2efe9]">{suite.name}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          suite.passed ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {suite.passed ? 'PASS' : 'FAIL'}
                      </span>
                    </div>

                    <div className="pl-6 space-y-1 text-[11px] text-[#9c9990]">
                      {suite.details.map((detail, dIdx) => (
                        <div key={dIdx} className="flex items-center justify-between">
                          <span className="text-[#c7c4bc]">· {detail.test}</span>
                          <span className={detail.passed ? 'text-emerald-400 font-bold' : 'text-red-400'}>
                            {detail.passed ? 'OK' : 'FAIL'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-3 border-t border-[#23262f] bg-[#0f1013]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#20222a] hover:bg-[#2b2e38] text-[#f2efe9] rounded text-xs transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
