"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

export function TelemetryScene() {
  const layers = useMemo(() => [
    { label: "solar input", value: 82, tone: "amber" },
    { label: "thermal loop", value: 57, tone: "sky" },
    { label: "evidence chain", value: 91, tone: "mint" },
  ], []);
  return (
    <div className="telemetry-visual" aria-label="Animated schematic of an orbital compute stack">
      <div className="telemetry-header">
        <span>H-01 / compute stack</span>
        <strong>signal nominal</strong>
      </div>
      <div className="telemetry-rail left" aria-hidden="true">
        <span>power bus</span>
        <span>optical link</span>
        <span className="hot">vacuum delta</span>
      </div>
      <motion.div
        className="telemetry-core"
        animate={{ rotate: 360 }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      >
        <div className="telemetry-core-content">
          <strong>H-01</strong>
          <span>learning loop</span>
        </div>
      </motion.div>
      <div className="telemetry-panel top-left">
        <div className="telemetry-panel-label"><span>power budget</span><b>8.4×</b></div>
        <div className="telemetry-bar"><i style={{ width: "82%" }} /></div>
        <div className="telemetry-panel-label"><span>uplink window</span><b>92%</b></div>
        <div className="telemetry-bar sky"><i style={{ width: "67%" }} /></div>
      </div>
      <div className="telemetry-panel bottom-right">
        <div className="telemetry-panel-label"><span>layers</span><b>03</b></div>
        {layers.map((layer) => (
          <div key={layer.label}>
            <div className="telemetry-panel-label"><span>{layer.label}</span><b>{layer.value}%</b></div>
            <div className="telemetry-bar"><i className={layer.tone} style={{ width: `${layer.value}%` }} /></div>
          </div>
        ))}
      </div>
      <div className="telemetry-rail bottom" aria-hidden="true">
        <span>evidence before belief</span>
        <span>revision friendly</span>
      </div>
    </div>
  );
}
