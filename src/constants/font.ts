/** 字体大小等级 */
export type FontSizeLevel = 'small' | 'standard' | 'large' | 'xlarge'

/** 字体大小等级标签 */
export const FONT_SIZE_LABELS: Record<FontSizeLevel, string> = {
  small: '小',
  standard: '标准',
  large: '大',
  xlarge: '极大',
}

/** 字体大小等级选项（按顺序） */
export const FONT_SIZE_OPTIONS: FontSizeLevel[] = ['small', 'standard', 'large', 'xlarge']

/**
 * 字体缩放因子映射
 *
 * 当前默认字体偏小，"标准"比现有尺寸增大约 10%，
 * 用户可根据需要选择更大或更小的字号。
 */
export const FONT_SCALE_MAP: Record<FontSizeLevel, number> = {
  small: 0.9,
  standard: 1.1,
  large: 1.25,
  xlarge: 1.45,
}
