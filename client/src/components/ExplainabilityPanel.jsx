import { useState } from 'react';
import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown, Sparkles, GraduationCap, Cog } from 'lucide-react';
import { cn } from '../lib/cn';
import { toEli5 } from '../lib/eli5';

export default function ExplainabilityPanel({ trace = [], redFlags = [] }) {
  const [mode, setMode] = useState('eli5');

  return (
    <div className="rounded-xl border border-trust-blue/20 bg-blue-50/60 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-trust-blue/10">
        <div className="flex items-center gap-2 text-trust-blue font-heading font-semibold">
          <Sparkles className="w-4 h-4" />
          Explainable AI
        </div>
        <div className="flex items-center rounded-lg bg-white border border-slate-200 p-0.5 text-sm">
          <button
            onClick={() => setMode('eli5')}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors', mode === 'eli5' ? 'bg-trust-blue text-white' : 'text-slate-600 hover:bg-slate-50')}
          >
            <GraduationCap className="w-3.5 h-3.5" /> ELI5
          </button>
          <button
            onClick={() => setMode('technical')}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors', mode === 'technical' ? 'bg-trust-blue text-white' : 'text-slate-600 hover:bg-slate-50')}
          >
            <Cog className="w-3.5 h-3.5" /> Technical
          </button>
        </div>
      </div>

      <Accordion.Root type="single" collapsible defaultValue="signals" className="px-5 py-2">
        <Accordion.Item value="signals" className="border-b border-trust-blue/10 last:border-0">
          <Accordion.Trigger className="flex w-full items-center justify-between py-3 text-sm font-medium text-slate-800 group">
            Signals checked ({trace.length})
            <ChevronDown className="w-4 h-4 text-slate-500 transition-transform group-data-[state=open]:rotate-180" />
          </Accordion.Trigger>
          <Accordion.Content className="pb-4">
            <ul className="space-y-2">
              {trace.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className={cn('mt-1.5 w-1.5 h-1.5 rounded-full shrink-0', item.hit ? 'bg-safety-orange' : 'bg-safe-green')} />
                  <span className="text-slate-700">
                    {mode === 'technical' ? (
                      <>
                        <span className="font-medium">{item.step}:</span> {item.result}
                      </>
                    ) : (
                      toEli5(item.step, item.hit)
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </Accordion.Content>
        </Accordion.Item>

        {redFlags.length > 0 && (
          <Accordion.Item value="flags">
            <Accordion.Trigger className="flex w-full items-center justify-between py-3 text-sm font-medium text-slate-800 group">
              Red-flag phrases ({redFlags.length})
              <ChevronDown className="w-4 h-4 text-slate-500 transition-transform group-data-[state=open]:rotate-180" />
            </Accordion.Trigger>
            <Accordion.Content className="pb-4">
              <div className="flex flex-wrap gap-2">
                {redFlags.map((flag, idx) => (
                  <span key={idx} className="text-xs font-mono bg-risk-red/10 text-risk-red px-2 py-1 rounded-md border border-risk-red/20">
                    "{flag}"
                  </span>
                ))}
              </div>
            </Accordion.Content>
          </Accordion.Item>
        )}
      </Accordion.Root>

      <div className="px-5 pb-4 text-xs text-slate-500">
        Powered by a transparent, rules-based heuristic engine - not a black-box model.
      </div>
    </div>
  );
}
