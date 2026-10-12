/**
 * EnvironmentManager.js - 官方权威全时代纯 3D 原始自然与生机大密林环境引擎
 * 架构设计：
 * 1. 实体战场平整行军主道 (长 95m, 宽 12m, Z: [-6.0, 6.0])：
 *    保证所有时代兵种行军交锋绝对贴地、阴影完整、扎实自然；
 * 2. 密林地表层 (长 115m, 宽 36m, Z: [-6.0, -42.0])：
 *    青翠森林苔藓与草地材质 (0x2e4a23)，与行军战道平滑拼接；
 * 3. 前景清澈流水溪流 (长 95m, 宽 5.5m, Z: [6.2, 11.7])：伴随鹅卵石、芦苇水草与倒木；
 * 4. 多重连绵 3D 大丛林生态 (共计约 250 株自然植被)：
 *    - 近景林缘灌木带 (bushes, bush_1, bush_2) 密集封堵边缘；
 *    - 中景阔叶针叶混交林 (tree_1~3, pine_1~3) 错落有致；
 *    - 远景高耸深林天际树冠墙 (scale 2.2~3.6) 彻底填满天际线，形成郁郁葱葱密林；
 * 5. 远方峡谷山峦微隐屏障 (canyon_mountains)；
 * 6. 全时代完全贯通，光影随时代更迭细腻演变。
 */

const JUNGLE_ITEMS = [
// --- 林缘灌木密植带 ---
  { type: 'bush_2', x: -52.0, z: -6.87, scale: 1.16, rot: 2.14 },
  { type: 'bush_1', x: -49.84, z: -8.5, scale: 1.19, rot: 2.53 },
  { type: 'bushes', x: -48.45, z: -6.69, scale: 1.22, rot: 1.16 },
  { type: 'bush_2', x: -46.5, z: -6.36, scale: 1.27, rot: 0.63 },
  { type: 'bush_2', x: -44.34, z: -7.37, scale: 1.37, rot: 1.04 },
  { type: 'bush_1', x: -43.0, z: -8.56, scale: 1.14, rot: 4.16 },
  { type: 'bush_2', x: -41.69, z: -8.14, scale: 1.37, rot: 3.96 },
  { type: 'bush_2', x: -39.76, z: -7.71, scale: 1.23, rot: 0.59 },
  { type: 'bushes', x: -37.73, z: -6.49, scale: 1.37, rot: 0.73 },
  { type: 'bush_1', x: -35.89, z: -7.59, scale: 1.09, rot: 0.14 },
  { type: 'bushes', x: -33.74, z: -7.25, scale: 1.41, rot: 0.72 },
  { type: 'bush_2', x: -32.01, z: -8.56, scale: 1.12, rot: 4.67 },
  { type: 'bush_1', x: -30.54, z: -8.29, scale: 1.37, rot: 0.89 },
  { type: 'bushes', x: -28.87, z: -6.61, scale: 1.33, rot: 5.99 },
  { type: 'bush_1', x: -26.8, z: -7.2, scale: 1.24, rot: 1.66 },
  { type: 'bush_1', x: -24.68, z: -6.68, scale: 1.4, rot: 0.11 },
  { type: 'bush_1', x: -23.03, z: -8.66, scale: 1.06, rot: 3.82 },
  { type: 'bush_2', x: -21.29, z: -7.14, scale: 1.25, rot: 3.26 },
  { type: 'bush_2', x: -19.26, z: -7.85, scale: 1.45, rot: 1.89 },
  { type: 'bush_1', x: -17.76, z: -7.89, scale: 1.29, rot: 0.48 },
  { type: 'bush_1', x: -15.54, z: -7.09, scale: 1.38, rot: 5.45 },
  { type: 'bush_1', x: -13.99, z: -6.43, scale: 1.35, rot: 0.12 },
  { type: 'bush_2', x: -12.85, z: -7.78, scale: 1.16, rot: 3.03 },
  { type: 'bush_2', x: -11.08, z: -7.69, scale: 1.11, rot: 4.43 },
  { type: 'bush_1', x: -9.27, z: -7.43, scale: 1.35, rot: 2.14 },
  { type: 'bushes', x: -7.13, z: -6.9, scale: 1.19, rot: 4.19 },
  { type: 'bush_2', x: -5.53, z: -7.27, scale: 1.07, rot: 4.51 },
  { type: 'bushes', x: -2.91, z: -6.93, scale: 1.23, rot: 1.85 },
  { type: 'bush_1', x: -1.36, z: -6.97, scale: 1.3, rot: 4.95 },
  { type: 'bush_1', x: 0.39, z: -7.17, scale: 1.38, rot: 5.01 },
  { type: 'bushes', x: 2.17, z: -7.63, scale: 1.29, rot: 2.31 },
  { type: 'bushes', x: 4.19, z: -6.83, scale: 1.25, rot: 0.66 },
  { type: 'bush_1', x: 5.59, z: -7.75, scale: 1.15, rot: 4.48 },
  { type: 'bush_1', x: 7.89, z: -8.26, scale: 1.16, rot: 3.34 },
  { type: 'bushes', x: 9.55, z: -8.79, scale: 1.13, rot: 4.37 },
  { type: 'bushes', x: 11.38, z: -8.65, scale: 1.21, rot: 1.6 },
  { type: 'bush_2', x: 12.78, z: -6.56, scale: 1.37, rot: 2.64 },
  { type: 'bush_2', x: 14.14, z: -7.35, scale: 1.27, rot: 2.57 },
  { type: 'bush_2', x: 15.92, z: -8.03, scale: 1.22, rot: 2.81 },
  { type: 'bush_2', x: 18.53, z: -8.43, scale: 1.09, rot: 3.67 },
  { type: 'bush_1', x: 19.88, z: -8.54, scale: 1.19, rot: 5.43 },
  { type: 'bush_1', x: 22.1, z: -8.41, scale: 1.18, rot: 4.74 },
  { type: 'bush_1', x: 23.72, z: -7.49, scale: 1.44, rot: 3.29 },
  { type: 'bush_2', x: 25.4, z: -7.91, scale: 1.15, rot: 5.75 },
  { type: 'bush_2', x: 27.14, z: -7.11, scale: 1.38, rot: 4.41 },
  { type: 'bushes', x: 29.06, z: -8.02, scale: 1.15, rot: 0.01 },
  { type: 'bush_2', x: 31.14, z: -8.76, scale: 1.31, rot: 5.74 },
  { type: 'bush_1', x: 33.02, z: -7.39, scale: 1.41, rot: 4.29 },
  { type: 'bush_2', x: 34.67, z: -8.38, scale: 1.12, rot: 6.08 },
  { type: 'bush_1', x: 36.59, z: -7.83, scale: 1.19, rot: 0.38 },
  { type: 'bush_2', x: 37.88, z: -7.04, scale: 1.07, rot: 2.96 },
  { type: 'bush_2', x: 39.57, z: -7.54, scale: 1.35, rot: 4.88 },
  { type: 'bush_2', x: 41.7, z: -7.49, scale: 1.44, rot: 0.79 },
  { type: 'bush_2', x: 42.91, z: -8.32, scale: 1.18, rot: 2.76 },
  { type: 'bush_1', x: 45.48, z: -8.47, scale: 1.09, rot: 1.86 },
  { type: 'bush_1', x: 46.59, z: -8.51, scale: 1.23, rot: 5.52 },
  { type: 'bush_2', x: 48.54, z: -8.41, scale: 1.42, rot: 1.39 },
  { type: 'bush_1', x: 50.57, z: -8.75, scale: 1.24, rot: 3.08 },
  { type: 'bush_1', x: 52.58, z: -8.45, scale: 1.15, rot: 2.52 },
// --- 战道边缘花草碎石倒木 ---
  { type: 'grasses', x: -47.2, z: -6.11, scale: 0.95, rot: 1.82 },
  { type: 'rock_1', x: -43.56, z: -6.36, scale: 1.06, rot: 5.42 },
  { type: 'grasses', x: -39.38, z: -6.25, scale: 1.18, rot: 2.25 },
  { type: 'rock_1', x: -36.47, z: -5.74, scale: 0.98, rot: 1.66 },
  { type: 'rock_1', x: -31.72, z: -5.35, scale: 1.24, rot: 1.94 },
  { type: 'grasses', x: -27.8, z: -5.45, scale: 1.12, rot: 2.0 },
  { type: 'trunk_1', x: -23.29, z: -5.75, scale: 0.9, rot: 5.25 },
  { type: 'rock_1', x: -19.21, z: -6.03, scale: 0.94, rot: 2.01 },
  { type: 'rock_1', x: -16.71, z: -6.31, scale: 1.18, rot: 1.02 },
  { type: 'pebble', x: -12.33, z: -5.84, scale: 1.13, rot: 1.38 },
  { type: 'grasses', x: -8.57, z: -5.8, scale: 0.92, rot: 0.37 },
  { type: 'rock_1', x: -4.64, z: -5.66, scale: 1.17, rot: 5.08 },
  { type: 'grasses', x: -0.45, z: -5.46, scale: 1.14, rot: 0.31 },
  { type: 'grasses', x: 4.8, z: -5.71, scale: 0.88, rot: 2.34 },
  { type: 'trunk_1', x: 7.67, z: -5.96, scale: 1.22, rot: 2.77 },
  { type: 'grasses', x: 12.15, z: -6.36, scale: 0.91, rot: 1.63 },
  { type: 'rock_1', x: 16.97, z: -6.39, scale: 1.17, rot: 4.75 },
  { type: 'rock_1', x: 19.04, z: -5.3, scale: 0.85, rot: 5.56 },
  { type: 'rock_1', x: 24.89, z: -5.65, scale: 1.22, rot: 1.19 },
  { type: 'grasses', x: 28.56, z: -6.3, scale: 0.88, rot: 4.7 },
  { type: 'pebble', x: 32.21, z: -5.74, scale: 0.9, rot: 1.99 },
  { type: 'trunk_1', x: 35.78, z: -5.95, scale: 0.92, rot: 5.63 },
  { type: 'grasses', x: 39.17, z: -5.8, scale: 1.09, rot: 0.03 },
  { type: 'grasses', x: 44.9, z: -5.99, scale: 0.88, rot: 4.49 },
  { type: 'grasses', x: 47.22, z: -5.65, scale: 1.23, rot: 2.58 },
// --- 中景生机混交林 ---
  { type: 'pine_2', x: -52.16, z: -14.16, scale: 1.75, rot: 4.21 },
  { type: 'tree_3', x: -49.52, z: -12.18, scale: 1.75, rot: 3.45 },
  { type: 'tree_1', x: -47.29, z: -14.59, scale: 1.62, rot: 1.4 },
  { type: 'pine_2', x: -45.42, z: -15.19, scale: 1.84, rot: 0.99 },
  { type: 'pine_1', x: -43.36, z: -9.87, scale: 1.47, rot: 5.3 },
  { type: 'pine_3', x: -40.42, z: -15.79, scale: 1.84, rot: 0.98 },
  { type: 'pine_3', x: -38.61, z: -12.37, scale: 1.83, rot: 4.76 },
  { type: 'tree_3', x: -35.82, z: -15.7, scale: 1.57, rot: 3.3 },
  { type: 'tree_3', x: -34.68, z: -13.37, scale: 1.57, rot: 3.42 },
  { type: 'tree_2', x: -32.78, z: -13.48, scale: 1.58, rot: 3.9 },
  { type: 'tree_2', x: -30.05, z: -14.44, scale: 1.77, rot: 2.91 },
  { type: 'tree_1', x: -28.34, z: -13.73, scale: 1.51, rot: 1.5 },
  { type: 'tree_2', x: -25.5, z: -10.02, scale: 1.43, rot: 5.64 },
  { type: 'pine_3', x: -23.08, z: -14.37, scale: 1.64, rot: 1.37 },
  { type: 'pine_2', x: -20.63, z: -11.15, scale: 1.53, rot: 0.5 },
  { type: 'pine_1', x: -18.21, z: -12.69, scale: 1.87, rot: 4.17 },
  { type: 'pine_3', x: -17.52, z: -9.61, scale: 1.93, rot: 4.08 },
  { type: 'pine_2', x: -15.39, z: -12.3, scale: 1.67, rot: 0.56 },
  { type: 'tree_2', x: -11.73, z: -11.03, scale: 1.39, rot: 4.69 },
  { type: 'pine_3', x: -9.87, z: -15.26, scale: 1.35, rot: 1.7 },
  { type: 'pine_1', x: -7.6, z: -15.29, scale: 1.68, rot: 3.29 },
  { type: 'pine_3', x: -6.08, z: -15.4, scale: 1.5, rot: 6.13 },
  { type: 'tree_3', x: -3.93, z: -14.03, scale: 1.65, rot: 5.03 },
  { type: 'pine_3', x: -2.18, z: -15.23, scale: 1.53, rot: 6.1 },
  { type: 'tree_3', x: 1.24, z: -9.76, scale: 1.82, rot: 2.33 },
  { type: 'pine_3', x: 2.9, z: -10.41, scale: 1.72, rot: 0.43 },
  { type: 'tree_1', x: 5.55, z: -15.8, scale: 1.54, rot: 5.65 },
  { type: 'pine_2', x: 7.84, z: -13.03, scale: 1.52, rot: 5.52 },
  { type: 'tree_1', x: 9.88, z: -16.32, scale: 1.68, rot: 3.39 },
  { type: 'pine_1', x: 11.49, z: -14.38, scale: 1.63, rot: 4.28 },
  { type: 'tree_3', x: 14.48, z: -12.7, scale: 1.67, rot: 3.8 },
  { type: 'tree_1', x: 15.6, z: -12.36, scale: 1.38, rot: 4.51 },
  { type: 'pine_2', x: 18.3, z: -15.03, scale: 1.58, rot: 1.06 },
  { type: 'pine_1', x: 19.84, z: -16.48, scale: 1.38, rot: 4.54 },
  { type: 'tree_1', x: 22.5, z: -13.39, scale: 1.84, rot: 5.21 },
  { type: 'pine_1', x: 24.6, z: -13.86, scale: 1.83, rot: 4.94 },
  { type: 'tree_1', x: 26.64, z: -14.33, scale: 1.53, rot: 4.38 },
  { type: 'pine_3', x: 29.99, z: -16.36, scale: 1.83, rot: 1.62 },
  { type: 'tree_1', x: 30.81, z: -15.5, scale: 1.63, rot: 0.91 },
  { type: 'tree_2', x: 33.73, z: -14.37, scale: 1.73, rot: 2.56 },
  { type: 'tree_2', x: 36.78, z: -9.62, scale: 1.35, rot: 1.76 },
  { type: 'tree_3', x: 38.88, z: -9.46, scale: 1.56, rot: 4.31 },
  { type: 'tree_2', x: 40.98, z: -14.92, scale: 1.69, rot: 0.8 },
  { type: 'tree_1', x: 42.03, z: -10.79, scale: 1.44, rot: 1.83 },
  { type: 'tree_3', x: 44.74, z: -9.85, scale: 1.86, rot: 0.48 },
  { type: 'tree_1', x: 46.69, z: -11.86, scale: 1.63, rot: 0.61 },
  { type: 'pine_3', x: 49.26, z: -12.64, scale: 1.57, rot: 1.69 },
  { type: 'pine_2', x: 51.16, z: -10.41, scale: 1.44, rot: 2.74 },
  { type: 'tree_2', x: 15.18, z: -11.91, scale: 1.64, rot: 5.87 },
  { type: 'pine_1', x: -29.15, z: -11.78, scale: 1.6, rot: 6.11 },
  { type: 'tree_1', x: 38.43, z: -10.01, scale: 1.39, rot: 1.37 },
  { type: 'tree_2', x: -25.51, z: -10.76, scale: 1.35, rot: 5.02 },
  { type: 'pine_3', x: -36.02, z: -10.06, scale: 1.51, rot: 5.4 },
  { type: 'pine_1', x: 40.78, z: -11.18, scale: 1.48, rot: 1.93 },
  { type: 'tree_2', x: -34.92, z: -13.49, scale: 1.57, rot: 6.1 },
  { type: 'tree_1', x: 13.09, z: -13.22, scale: 1.55, rot: 1.14 },
  { type: 'tree_1', x: 32.44, z: -12.01, scale: 1.83, rot: 3.7 },
  { type: 'tree_1', x: -49.86, z: -11.46, scale: 1.56, rot: 0.78 },
  { type: 'pine_1', x: 39.69, z: -11.99, scale: 1.63, rot: 0.36 },
  { type: 'pine_1', x: 15.12, z: -10.85, scale: 1.82, rot: 0.52 },
  { type: 'tree_2', x: -1.29, z: -16.13, scale: 1.39, rot: 5.9 },
  { type: 'pine_1', x: 30.27, z: -10.92, scale: 1.68, rot: 3.1 },
  { type: 'pine_1', x: -46.44, z: -15.45, scale: 1.6, rot: 3.93 },
  { type: 'tree_1', x: 11.66, z: -10.85, scale: 1.39, rot: 5.29 },
  { type: 'pine_3', x: -31.61, z: -13.35, scale: 1.49, rot: 4.99 },
  { type: 'tree_1', x: 19.52, z: -16.75, scale: 1.71, rot: 1.18 },
  { type: 'tree_2', x: 1.2, z: -16.62, scale: 1.64, rot: 3.45 },
  { type: 'tree_2', x: 26.14, z: -13.83, scale: 1.37, rot: 0.65 },
  { type: 'pine_3', x: -46.37, z: -12.2, scale: 1.4, rot: 4.47 },
  { type: 'tree_1', x: 32.14, z: -10.05, scale: 1.45, rot: 4.64 },
  { type: 'tree_1', x: -25.75, z: -13.38, scale: 1.61, rot: 5.8 },
  { type: 'tree_1', x: 33.98, z: -10.73, scale: 1.4, rot: 1.08 },
  { type: 'pine_1', x: -12.75, z: -17.39, scale: 1.4, rot: 1.02 },
  { type: 'tree_2', x: -14.94, z: -15.95, scale: 1.83, rot: 5.81 },
  { type: 'tree_2', x: 46.33, z: -14.69, scale: 1.39, rot: 6.17 },
  { type: 'pine_1', x: -17.98, z: -14.88, scale: 1.84, rot: 4.27 },
  { type: 'pine_3', x: -33.35, z: -13.17, scale: 1.59, rot: 3.09 },
  { type: 'tree_1', x: -37.42, z: -11.51, scale: 1.65, rot: 4.43 },
// --- 远景高耸天际深林墙 ---
  { type: 'tree_1', x: -55.34, z: -23.33, scale: 2.48, rot: 2.0 },
  { type: 'tree_1', x: -53.32, z: -26.19, scale: 2.14, rot: 3.24 },
  { type: 'pine_2', x: -51.88, z: -19.96, scale: 3.04, rot: 2.03 },
  { type: 'tree_1', x: -49.77, z: -20.8, scale: 2.51, rot: 1.5 },
  { type: 'pine_3', x: -48.38, z: -25.53, scale: 2.83, rot: 6.21 },
  { type: 'pine_2', x: -45.62, z: -19.82, scale: 2.41, rot: 4.18 },
  { type: 'tree_1', x: -44.4, z: -21.46, scale: 2.41, rot: 2.45 },
  { type: 'tree_2', x: -41.98, z: -26.23, scale: 2.94, rot: 4.76 },
  { type: 'pine_1', x: -41.05, z: -21.45, scale: 2.3, rot: 2.77 },
  { type: 'tree_1', x: -38.39, z: -24.29, scale: 2.5, rot: 4.61 },
  { type: 'tree_2', x: -37.63, z: -17.58, scale: 2.46, rot: 2.94 },
  { type: 'tree_2', x: -35.75, z: -24.69, scale: 3.2, rot: 0.32 },
  { type: 'tree_1', x: -33.11, z: -26.28, scale: 3.0, rot: 5.39 },
  { type: 'tree_1', x: -31.2, z: -22.62, scale: 3.15, rot: 2.71 },
  { type: 'pine_2', x: -29.41, z: -18.64, scale: 2.55, rot: 4.01 },
  { type: 'pine_2', x: -28.21, z: -23.59, scale: 2.9, rot: 2.32 },
  { type: 'tree_2', x: -26.27, z: -22.52, scale: 2.76, rot: 5.46 },
  { type: 'pine_3', x: -24.13, z: -26.24, scale: 2.97, rot: 0.27 },
  { type: 'pines', x: -22.35, z: -28.88, scale: 2.42, rot: 4.95 },
  { type: 'pine_1', x: -21.08, z: -28.18, scale: 2.74, rot: 4.15 },
  { type: 'pine_2', x: -19.7, z: -20.03, scale: 2.87, rot: 4.4 },
  { type: 'pine_1', x: -17.47, z: -24.1, scale: 2.96, rot: 1.06 },
  { type: 'tree_1', x: -14.78, z: -19.03, scale: 2.78, rot: 2.61 },
  { type: 'tree_2', x: -14.3, z: -25.11, scale: 2.31, rot: 5.21 },
  { type: 'tree_2', x: -11.62, z: -25.06, scale: 2.64, rot: 3.87 },
  { type: 'tree_1', x: -10.45, z: -28.43, scale: 3.08, rot: 3.38 },
  { type: 'pine_3', x: -8.0, z: -22.97, scale: 2.25, rot: 2.6 },
  { type: 'pines', x: -5.81, z: -19.79, scale: 2.47, rot: 6.18 },
  { type: 'pines', x: -4.38, z: -22.95, scale: 2.79, rot: 0.73 },
  { type: 'tree_1', x: -2.83, z: -18.27, scale: 2.73, rot: 3.32 },
  { type: 'pine_2', x: -0.66, z: -22.18, scale: 2.5, rot: 4.08 },
  { type: 'tree_1', x: 0.46, z: -23.74, scale: 2.56, rot: 5.18 },
  { type: 'tree_2', x: 2.01, z: -20.43, scale: 2.69, rot: 0.12 },
  { type: 'tree_2', x: 4.79, z: -21.7, scale: 2.13, rot: 2.26 },
  { type: 'pine_1', x: 6.29, z: -24.88, scale: 2.94, rot: 1.79 },
  { type: 'pines', x: 8.15, z: -24.49, scale: 2.45, rot: 1.46 },
  { type: 'pine_2', x: 9.64, z: -28.45, scale: 2.54, rot: 2.7 },
  { type: 'pine_1', x: 11.61, z: -24.75, scale: 2.43, rot: 1.85 },
  { type: 'pine_3', x: 13.0, z: -24.55, scale: 2.53, rot: 4.28 },
  { type: 'tree_2', x: 15.67, z: -28.61, scale: 2.84, rot: 1.54 },
  { type: 'tree_2', x: 17.67, z: -24.35, scale: 2.38, rot: 2.1 },
  { type: 'tree_1', x: 19.28, z: -28.17, scale: 2.12, rot: 0.73 },
  { type: 'pine_3', x: 20.55, z: -21.52, scale: 2.52, rot: 1.76 },
  { type: 'pine_3', x: 21.79, z: -22.77, scale: 2.79, rot: 1.91 },
  { type: 'pine_1', x: 23.76, z: -17.8, scale: 2.64, rot: 0.09 },
  { type: 'tree_1', x: 25.49, z: -20.41, scale: 2.85, rot: 6.2 },
  { type: 'tree_2', x: 27.59, z: -23.73, scale: 2.88, rot: 4.79 },
  { type: 'pine_2', x: 29.82, z: -22.45, scale: 2.71, rot: 1.99 },
  { type: 'pine_1', x: 31.89, z: -19.89, scale: 2.47, rot: 5.57 },
  { type: 'tree_2', x: 33.01, z: -25.17, scale: 3.1, rot: 2.45 },
  { type: 'pine_2', x: 35.52, z: -21.36, scale: 2.59, rot: 1.86 },
  { type: 'pine_3', x: 36.96, z: -18.76, scale: 3.05, rot: 3.76 },
  { type: 'tree_2', x: 39.13, z: -17.79, scale: 2.13, rot: 4.92 },
  { type: 'pines', x: 40.71, z: -23.4, scale: 2.53, rot: 0.32 },
  { type: 'pine_2', x: 42.46, z: -27.69, scale: 2.78, rot: 3.67 },
  { type: 'tree_1', x: 43.41, z: -25.26, scale: 2.57, rot: 3.67 },
  { type: 'pine_2', x: 46.28, z: -17.77, scale: 2.93, rot: 5.71 },
  { type: 'tree_1', x: 47.28, z: -22.28, scale: 2.96, rot: 0.94 },
  { type: 'pine_1', x: 49.02, z: -25.28, scale: 3.17, rot: 4.15 },
  { type: 'tree_1', x: 51.03, z: -23.62, scale: 2.27, rot: 3.52 },
  { type: 'tree_2', x: 53.57, z: -19.81, scale: 2.63, rot: 0.05 },
  { type: 'pine_3', x: 54.89, z: -23.63, scale: 2.75, rot: 2.94 },
  { type: 'pine_3', x: -52.36, z: -31.17, scale: 3.13, rot: 2.21 },
  { type: 'pine_3', x: -46.88, z: -31.27, scale: 3.19, rot: 2.94 },
  { type: 'pine_3', x: -42.39, z: -29.42, scale: 3.23, rot: 2.83 },
  { type: 'pine_3', x: -36.61, z: -27.09, scale: 3.44, rot: 0.98 },
  { type: 'pines', x: -32.01, z: -30.48, scale: 3.04, rot: 4.88 },
  { type: 'pine_3', x: -27.53, z: -28.68, scale: 3.57, rot: 0.08 },
  { type: 'pine_3', x: -22.53, z: -27.55, scale: 2.89, rot: 2.45 },
  { type: 'pine_1', x: -17.45, z: -29.83, scale: 3.47, rot: 3.0 },
  { type: 'pine_3', x: -12.94, z: -30.23, scale: 3.36, rot: 4.65 },
  { type: 'pine_1', x: -5.83, z: -30.11, scale: 2.84, rot: 5.65 },
  { type: 'pines', x: -2.8, z: -31.76, scale: 2.98, rot: 4.06 },
  { type: 'pines', x: 3.32, z: -30.7, scale: 3.02, rot: 1.83 },
  { type: 'pine_3', x: 8.72, z: -29.94, scale: 2.81, rot: 1.01 },
  { type: 'pine_3', x: 14.09, z: -28.25, scale: 3.02, rot: 2.29 },
  { type: 'pine_3', x: 18.42, z: -31.69, scale: 3.08, rot: 4.7 },
  { type: 'pine_1', x: 22.78, z: -27.79, scale: 2.95, rot: 3.67 },
  { type: 'pine_1', x: 29.2, z: -30.49, scale: 2.86, rot: 2.62 },
  { type: 'pine_3', x: 33.96, z: -27.35, scale: 3.25, rot: 5.73 },
  { type: 'pines', x: 38.23, z: -31.49, scale: 3.26, rot: 3.61 },
  { type: 'pine_3', x: 42.76, z: -31.33, scale: 3.52, rot: 5.03 },
  { type: 'pine_1', x: 47.69, z: -28.16, scale: 2.81, rot: 0.9 },
// --- 前景水岸天然石草 ---
  { type: 'pebble', x: -45.17, z: 7.36, scale: 1.03, rot: 2.71 },
  { type: 'pebble', x: -41.56, z: 6.85, scale: 1.26, rot: 3.62 },
  { type: 'pebble', x: -36.92, z: 7.28, scale: 0.91, rot: 1.97 },
  { type: 'bush_1', x: -31.78, z: 6.67, scale: 1.27, rot: 5.85 },
  { type: 'pebble', x: -26.28, z: 6.95, scale: 0.92, rot: 0.24 },
  { type: 'grasses', x: -20.53, z: 7.15, scale: 1.28, rot: 0.01 },
  { type: 'pebble', x: -15.4, z: 7.22, scale: 1.0, rot: 0.74 },
  { type: 'pebble', x: -11.28, z: 7.25, scale: 0.97, rot: 5.64 },
  { type: 'bush_1', x: -6.71, z: 6.46, scale: 0.93, rot: 1.62 },
  { type: 'pebble', x: -0.61, z: 6.67, scale: 1.15, rot: 3.67 },
  { type: 'pebble', x: 3.9, z: 7.04, scale: 1.24, rot: 4.73 },
  { type: 'pebble', x: 9.85, z: 6.56, scale: 0.96, rot: 1.48 },
  { type: 'pebble', x: 13.01, z: 6.81, scale: 0.97, rot: 3.61 },
  { type: 'trunk_1', x: 19.72, z: 7.18, scale: 1.2, rot: 0.58 },
  { type: 'bush_1', x: 24.62, z: 6.91, scale: 1.23, rot: 3.01 },
  { type: 'pebble', x: 28.65, z: 7.39, scale: 1.12, rot: 0.27 },
  { type: 'trunk_1', x: 34.39, z: 7.32, scale: 1.19, rot: 1.71 },
  { type: 'trunk_1', x: 39.33, z: 6.4, scale: 1.08, rot: 2.33 },
  { type: 'bush_1', x: 43.56, z: 6.99, scale: 1.29, rot: 1.86 }
];

export class EnvironmentManager {
  constructor(scene, gltfLoader, lights = {}) {
    this.scene = scene;
    this.gltfLoader = gltfLoader;
    this.lights = lights; // { sunLight, skyLight, ambientLight }

    this.group = new THREE.Group();
    this.scene.add(this.group);

    // 核心 3D 生态与丛林组 (全时代贯通)
    this.natureGroup = new THREE.Group();
    this.group.add(this.natureGroup);

    this.currentAge = 1;
    this.natureDict = null;
    this.bgMode = 'jungle';
  }

  async build() {
    this.setupGround();
    this.setupRiver();
    await this.setupNatureAssets();
    await this.setAge(1);
  }

  // 1. 实体自然地形走廊
  setupGround() {
    // (1) 实体主行军走廊 (长 95m, 宽 12m, Z: [-6.0, 6.0], Y: 0)
    // 质感扎实，角色脚底完美接触
    const groundGeo = new THREE.PlaneGeometry(95, 12, 48, 12);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x5a4835,       // 自然温润泥土地表
      roughness: 0.90,
      metalness: 0.05,
      flatShading: true
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.set(0, 0, 0);
    groundMesh.receiveShadow = true;
    this.natureGroup.add(groundMesh);

    // (2) 战道北侧向密林深处延伸的森林草地 (长 115m, 宽 36m, Z: [-6.0, -42.0])
    const forestFloorGeo = new THREE.PlaneGeometry(115, 36, 32, 16);
    const forestFloorMat = new THREE.MeshStandardMaterial({
      color: 0x2e4a23,       // 密林青翠苔藓草甸
      roughness: 0.92,
      metalness: 0.02,
      flatShading: true
    });
    const forestFloorMesh = new THREE.Mesh(forestFloorGeo, forestFloorMat);
    forestFloorMesh.rotation.x = -Math.PI / 2;
    forestFloorMesh.position.set(0, -0.04, -24.0);
    forestFloorMesh.receiveShadow = true;
    this.natureGroup.add(forestFloorMesh);
  }

  // 2. 前景清澈溪流水岸 (位于近景 Z: 6.2 ~ 11.7)
  setupRiver() {
    const riverGeo = new THREE.PlaneGeometry(95, 5.5, 32, 8);
    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x357888,       // 清澈溪流青蓝色
      roughness: 0.15,
      metalness: 0.45,
      transparent: true,
      opacity: 0.88,
      flatShading: true
    });
    const riverMesh = new THREE.Mesh(riverGeo, riverMat);
    riverMesh.rotation.x = -Math.PI / 2;
    riverMesh.position.set(0, -0.08, 8.8);
    riverMesh.receiveShadow = true;
    this.natureGroup.add(riverMesh);

    // 河床砂石泥底
    const riverBedGeo = new THREE.PlaneGeometry(95, 5.5);
    const riverBedMat = new THREE.MeshStandardMaterial({
      color: 0x242d2a,
      roughness: 0.95
    });
    const riverBed = new THREE.Mesh(riverBedGeo, riverBedMat);
    riverBed.rotation.x = -Math.PI / 2;
    riverBed.position.set(0, -0.22, 8.8);
    this.natureGroup.add(riverBed);
  }

  // 3. 加载全部 3D 自然资产并构建连绵郁郁葱葱大丛林
  async setupNatureAssets() {
    const loadGltf = (file) => new Promise(res => {
      this.gltfLoader.load(file, (gltf) => {
        res(gltf.scene);
      }, undefined, () => res(null));
    });

    const [
      mountains,
      t1, t2, t3, p1, p2, p3, pines,
      rock, bush, bush2, bushes, grasses, pebble, trunk
    ] = await Promise.all([
      loadGltf('./models/era1/canyon_mountains.glb'),
      loadGltf('./models/era1/tree_1.glb'),
      loadGltf('./models/era1/tree_2.glb'),
      loadGltf('./models/era1/tree_3.glb'),
      loadGltf('./models/era1/pine_1.glb'),
      loadGltf('./models/era1/pine_2.glb'),
      loadGltf('./models/era1/pine_3.glb'),
      loadGltf('./models/environment/pines.glb'),
      loadGltf('./models/era1/rock_1.glb'),
      loadGltf('./models/era1/bush_1.glb'),
      loadGltf('./models/era1/bush_2.glb'),
      loadGltf('./models/era1/bushes.glb'),
      loadGltf('./models/era1/grasses.glb'),
      loadGltf('./models/era1/pebble.glb'),
      loadGltf('./models/era1/trunk_1.glb')
    ]);

    const dict = {
      mountains,
      tree_1: t1, tree_2: t2, tree_3: t3,
      pine_1: p1, pine_2: p2, pine_3: p3, pines,
      rock_1: rock, bush_1: bush, bush_2: bush2, bushes,
      grasses, pebble, trunk_1: trunk
    };
    this.natureDict = dict;

    // (1) 远景宏伟峡谷山峦屏障 (横跨天际线 X: [-45, 45], Z: -34.0)
    if (dict.mountains) {
      [-42, 0, 42].forEach(mx => {
        const m = dict.mountains.clone(true);
        m.position.set(mx, 0, -34.0);
        m.scale.set(1.45, 1.5, 1.25);
        m.traverse(c => {
          if (c.isMesh) {
            c.castShadow = false;
            c.receiveShadow = true;
          }
        });
        this.natureGroup.add(m);
      });
    }

    // (2) 植入全部生机密林元素 (灌木篱带、错落树林、天际树冠墙、林间花石)
    JUNGLE_ITEMS.forEach(item => {
      const src = dict[item.type];
      if (!src) return;
      const clone = src.clone(true);
      clone.position.set(item.x, 0, item.z);
      if (item.rot !== undefined) {
        clone.rotation.y = item.rot;
      } else {
        clone.rotation.y = Math.random() * Math.PI * 2;
      }
      const s = item.scale || 1.0;
      clone.scale.set(s, s, s);
      clone.traverse(c => {
        if (c.isMesh) {
          c.castShadow = true;
          c.receiveShadow = true;
        }
      });
      this.natureGroup.add(clone);
    });

    console.log("🌲 纯 3D 生机大丛林生态构建完毕，共植入", JUNGLE_ITEMS.length, "株自然植物与地貌资产！");
  }

  setBgMode(mode) {
    // 保持接口兼容
  }

  /**
   * 时代切换：纯 3D 密林大自然战场保持贯通，光影与氛围随时代细腻变化
   */
  async setAge(age) {
    this.currentAge = age;

    // 时代自然采光与蔚蓝天空配置
    const eraLighting = {
      1: { sky: 0x38bdf8, sun: 0xfffaed, intensity: 1.6,  ambient: 0xfffbeb, ambInt: 0.65 },
      2: { sky: 0x0ea5e9, sun: 0xfef08a, intensity: 1.65, ambient: 0xfef9c3, ambInt: 0.65 },
      3: { sky: 0x38bdf8, sun: 0xffedd5, intensity: 1.7,  ambient: 0xffedd5, ambInt: 0.65 },
      4: { sky: 0x64748b, sun: 0xfbbf24, intensity: 1.55, ambient: 0xf1f5f9, ambInt: 0.60 },
      5: { sky: 0x0f172a, sun: 0x93c5fd, intensity: 1.75, ambient: 0x818cf8, ambInt: 0.65 }
    };

    const conf = eraLighting[age] || eraLighting[1];
    this.scene.background = new THREE.Color(conf.sky);
    this.scene.fog = null;

    if (this.lights.sunLight) {
      this.lights.sunLight.color.setHex(conf.sun);
      this.lights.sunLight.intensity = conf.intensity;
    }
    if (this.lights.ambientLight) {
      this.lights.ambientLight.color.setHex(conf.ambient);
      this.lights.ambientLight.intensity = conf.ambInt;
    }
    if (this.lights.skyLight) {
      this.lights.skyLight.color.setHex(conf.sky);
      this.lights.skyLight.intensity = 0.5;
    }

    console.log(`🌲 [Environment] 时代 ${age} 3D 密林自然战场布景就绪`);
  }
}
