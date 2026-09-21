import { type Ref, useId } from "react";
import { readableTextColor } from "../lib/color";
import { buildEyePaths } from "../lib/eyes";
import { buildLayout, MODULE_PX } from "../lib/layout";
import { CUSTOM_LOGO, findLogoOption, NO_LOGO } from "../lib/logos";
import {
  finderOrigins,
  isFinderModule,
  isInRange,
  isStructuralModule,
  logoClearRange,
  type QrMatrix,
  QUIET_ZONE,
} from "../lib/matrix";
import { buildModulePath, roundedRectPath } from "../lib/paths";
import type { Design } from "../types";

/**
 * Generic stack only. Web fonts are not available when the browser rasterizes
 * this markup for the PNG export, so the caption has to survive on system faces.
 */
const LABEL_FONT = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

/** Caption tracking, as a fraction of the font size. */
const LABEL_TRACKING = 0.08;

export interface QrArtworkProps {
  matrix: QrMatrix;
  design: Design;
  /** Encoded into the SVG as a `<title>`, so the export is labelled too. */
  title: string;
  className?: string;
  ref?: Ref<SVGSVGElement>;
}

/**
 * The QR code itself: one self-contained SVG that doubles as the preview and,
 * once serialized, as the downloaded artwork.
 */
export function QrArtwork({ matrix, design, title, className, ref }: QrArtworkProps) {
  const clipId = useId();
  const layout = buildLayout(matrix.size, design.frame);
  const logoOption = findLogoOption(design.logoId);
  const hasCustomLogo = design.logoId === CUSTOM_LOGO && !!design.customLogo;
  const hasLogo = design.logoId !== NO_LOGO && (!!logoOption || hasCustomLogo);
  const clearRange = hasLogo ? logoClearRange(matrix.size, design.logoRatio) : null;

  // Finder patterns get their own shapes below, and nothing is drawn under the
  // logo plate. Everything else splits into data modules, which take the chosen
  // shape, and the structural patterns, which stay square so readers can still
  // lock onto the grid.
  const isHandledElsewhere = (row: number, col: number) =>
    isFinderModule(matrix.size, row, col) || isInRange(clearRange, row, col);

  const modulesPath = buildModulePath({
    matrix,
    style: design.moduleStyle,
    skip: (row, col) => isHandledElsewhere(row, col) || isStructuralModule(matrix, row, col),
  });

  const structuralPath = buildModulePath({
    matrix,
    style: "square",
    skip: (row, col) => isHandledElsewhere(row, col) || !isStructuralModule(matrix, row, col),
  });

  const eyeColor = design.eyeColor ?? design.foreground;
  const cardFill = layout.solidCard ? design.frameColor : design.background;
  const labelColor = layout.solidCard ? readableTextColor(design.frameColor) : design.frameColor;

  // Module-space origin of the symbol, with the quiet zone already accounted for.
  const symbolX = layout.qr.x + QUIET_ZONE * MODULE_PX;
  const symbolY = layout.qr.y + QUIET_ZONE * MODULE_PX;
  const symbolPx = matrix.size * MODULE_PX;

  const plateSize = symbolPx * design.logoRatio;
  const plate = {
    x: symbolX + (symbolPx - plateSize) / 2,
    y: symbolY + (symbolPx - plateSize) / 2,
    size: plateSize,
    radius: plateSize * 0.22,
  };
  const iconSize = plateSize * 0.68;
  const iconOffset = (plateSize - iconSize) / 2;
  const LogoIcon = logoOption?.icon;

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      className={className}
      role="img"
    >
      <title>{title}</title>

      <path
        d={roundedRectPath(0, 0, layout.width, layout.height, cornerRadii(layout.cardRadius))}
        fill={cardFill}
      />

      {layout.panel && (
        <path
          d={roundedRectPath(
            layout.panel.x,
            layout.panel.y,
            layout.panel.width,
            layout.panel.height,
            cornerRadii(layout.panel.radius),
          )}
          fill={design.background}
        />
      )}

      <g transform={`translate(${symbolX} ${symbolY}) scale(${MODULE_PX})`}>
        <path d={modulesPath} fill={design.foreground} shapeRendering="geometricPrecision" />
        <path d={structuralPath} fill={design.foreground} shapeRendering="geometricPrecision" />
        {finderOrigins(matrix.size).map((origin) => {
          const { ring, pupil } = buildEyePaths(design.eyeStyle, origin.col, origin.row);
          return (
            <g key={`${origin.row}-${origin.col}`} fill={eyeColor}>
              <path d={ring} fillRule="evenodd" />
              <path d={pupil} />
            </g>
          );
        })}
      </g>

      {hasLogo && (
        <>
          <path
            d={roundedRectPath(plate.x, plate.y, plate.size, plate.size, cornerRadii(plate.radius))}
            fill={design.background}
          />
          {hasCustomLogo && design.customLogo ? (
            <>
              <clipPath id={clipId}>
                <path
                  d={roundedRectPath(
                    plate.x,
                    plate.y,
                    plate.size,
                    plate.size,
                    cornerRadii(plate.radius),
                  )}
                />
              </clipPath>
              <image
                href={design.customLogo}
                x={plate.x}
                y={plate.y}
                width={plate.size}
                height={plate.size}
                preserveAspectRatio="xMidYMid meet"
                clipPath={`url(#${clipId})`}
              />
            </>
          ) : (
            LogoIcon && (
              <LogoIcon
                x={plate.x + iconOffset}
                y={plate.y + iconOffset}
                size={iconSize}
                color={design.foreground}
                weight="fill"
              />
            )
          )}
        </>
      )}

      {layout.border && (
        <path
          d={roundedRectPath(
            layout.border.x,
            layout.border.y,
            layout.border.width,
            layout.border.height,
            cornerRadii(layout.border.radius),
          )}
          fill="none"
          stroke={design.frameColor}
          strokeWidth={layout.border.strokeWidth}
          strokeDasharray={
            layout.border.dashed
              ? `${layout.border.strokeWidth * 3} ${layout.border.strokeWidth * 2.2}`
              : undefined
          }
          strokeLinecap="round"
        />
      )}

      {layout.label && design.label.trim() && (
        <text
          // Letter spacing is also applied after the final glyph, so nudge the
          // anchor left by half of it to keep the caption optically centered.
          x={layout.label.x - (layout.label.fontSize * LABEL_TRACKING) / 2}
          y={layout.label.y}
          fill={labelColor}
          fontFamily={LABEL_FONT}
          fontSize={layout.label.fontSize}
          fontWeight={700}
          letterSpacing={layout.label.fontSize * LABEL_TRACKING}
          textAnchor="middle"
        >
          {design.label.trim()}
        </text>
      )}
    </svg>
  );
}

function cornerRadii(radius: number) {
  return [radius, radius, radius, radius] as const;
}
