import {Sparkles} from "lucide-react";
import React from "react";

export function AISparkleBox() {
    return (
        <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-3">
            <Sparkles size={20} className="text-primary mt-0.5 flex-shrink-0"/>
            <div>
                <div className="font-bold text-sm text-gray-900">AI сгенерирует оптимальный план</div>
                <div className="text-xs text-gray-600 mt-1">
                    Система учтёт все пререквизиты и равномерно распределит нагрузку
                </div>
            </div>
        </div>
    );
}