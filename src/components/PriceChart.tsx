import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { Palette } from "../theme/tokens";

export const CHART_W = 350;
export const CHART_H = 150;

export const buildPaths = (data: number[]) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const pts = data.map((v, i) => ({
        x: (i / (data.length - 1)) * (CHART_W - 10),
        y: 8 + (1 - (v - min) / (max - min || 1)) * (CHART_H - 20),
    }));
    const line = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const area = `${line} L${pts[pts.length - 1].x},${CHART_H} L0,${CHART_H} Z`;
    return { line, area, last: pts[pts.length - 1] };
};

export const Chart = ({ line, area, last, p, id = "fill" }: { line: string; area: string; last: { x: number; y: number }; p: Palette; id?: string }) => (
    <Svg width="100%" height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
        <Defs>
            <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={p.accent} stopOpacity={0.55} />
                <Stop offset="1" stopColor={p.accent} stopOpacity={0.05} />
            </LinearGradient>
        </Defs>
        <Path d={area} fill={`url(#${id})`} />
        <Path d={line} stroke={p.text} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        <Circle cx={last.x} cy={last.y} r={5} fill={p.accent} stroke={p.text} strokeWidth={2} />
    </Svg>
);
