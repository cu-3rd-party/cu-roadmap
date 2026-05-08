import {ArrowLeft} from "lucide-react";
import React from "react";

interface StepNavigationProps {
    onBack?: () => void;
    onNext?: () => void;
    nextLabel?: string;
    nextIcon?: React.ReactNode;
    backLabel?: string;
    loading?: boolean;
    disabled?: boolean;
}

export function StepNavigation({
                                   onBack,
                                   onNext,
                                   nextLabel = "Далее",
                                   nextIcon,
                                   backLabel = "Назад",
                                   loading = false,
                                   disabled = false,
                               }: StepNavigationProps) {
    return (
        <div className={`flex ${onBack ? "justify-between" : "justify-end"} mt-6 max-w-xl mx-auto gap-1`}>
            {onBack && (
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 bg-gray-100 text-gray-700 border-none px-5 py-3 rounded-xl font-bold text-sm cursor-pointer hover:bg-gray-200 transition-colors"
                >
                    <ArrowLeft size={18}/> {backLabel}
                </button>
            )}
            {onNext && (
                <button
                    onClick={onNext}
                    disabled={disabled || loading}
                    className="flex items-center gap-2 bg-primary text-white border-none px-6 py-3 rounded-xl font-bold text-sm cursor-pointer disabled:opacity-50 hover:bg-blue-600 transition-colors"
                >
                    {loading ? "Генерируем..." : nextLabel} {nextIcon}
                </button>
            )}
        </div>
    );
}