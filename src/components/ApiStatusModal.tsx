import React, { useState } from 'react';
import { X, ExternalLink, Copy, Check, Database, RefreshCw, Terminal } from 'lucide-react';
import { ApiResponse } from '../types';

interface ApiStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiData: ApiResponse | null;
  onReFetch: () => void;
  isLoading: boolean;
}

export const ApiStatusModal: React.FC<ApiStatusModalProps> = ({
  isOpen,
  onClose,
  apiData,
  onReFetch,
  isLoading,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const API_URL =
    'https://script.google.com/macros/s/AKfycbzR5QefCeu4Wdg9A8PcNzYyBcL7vOvKrP-nHakwa1XUwqX3bW3oSRih-FHYB2crxY3B-w/exec?action=getWorkouts';

  const jsonString = JSON.stringify(apiData?.data || {}, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                구글 스프레드시트 WebApp API 정보
              </h3>
              <p className="text-xs text-slate-500">
                지정된 구글 웹앱 엔드포인트 실시간 통신 상태
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* API Endpoint & Status Bar */}
        <div className="mt-4 space-y-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 mb-1 flex items-center justify-between">
              <span>GET 요청 API 주소</span>
              <a
                href={API_URL}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-600 hover:underline flex items-center gap-0.5"
              >
                <span>브라우저에서 직접 열기</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="font-mono text-xs text-slate-800 break-all select-all bg-white p-2 rounded-lg border border-slate-200">
              {API_URL}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                API 응답 성공 (HTTP 200 OK)
              </span>
              <span className="text-slate-500">
                기록 건수: {apiData?.data?.records?.length || 0}건
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>복사됨!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-400" />
                    <span>JSON 복사</span>
                  </>
                )}
              </button>

              <button
                onClick={onReFetch}
                disabled={isLoading}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition disabled:opacity-60"
              >
                <RefreshCw
                  className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`}
                />
                <span>재호출</span>
              </button>
            </div>
          </div>
        </div>

        {/* JSON Viewer */}
        <div className="mt-3 flex-1 min-h-[220px] overflow-hidden flex flex-col rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono">
          <div className="px-3 py-2 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>실제 반환된 JSON 원본 데이터</span>
            </div>
            {apiData?.fetchedAt && (
              <span>
                {new Date(apiData.fetchedAt).toLocaleTimeString('ko-KR')} 기준
              </span>
            )}
          </div>
          <div className="p-3 overflow-auto flex-1 max-h-[300px]">
            <pre className="text-emerald-400 leading-relaxed">{jsonString}</pre>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>구글 스프레드시트의 새 운동 데이터가 실시간으로 반영됩니다.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
