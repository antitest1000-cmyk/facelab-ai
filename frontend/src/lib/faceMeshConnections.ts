/**
 * MediaPipe Face Mesh anatomical structures and connection definitions.
 */

// Key facial contour paths (loops)
export const CONTOUR_CHAINS = {
  faceOval: [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378,
    400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21,
    54, 103, 67, 109, 10,
  ],
  lipsOuter: [
    61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37,
    39, 40, 185, 61,
  ],
  lipsInner: [
    78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82,
    81, 80, 191, 78,
  ],
  leftEye: [
    33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7, 33,
  ],
  rightEye: [
    263, 466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373, 390, 249, 263,
  ],
  leftEyebrow: [70, 63, 105, 66, 107, 55, 65, 52, 53, 46],
  rightEyebrow: [336, 296, 334, 293, 300, 285, 295, 282, 283, 276],
  noseBridge: [168, 6, 197, 195, 5, 4, 1, 19, 94, 2],
  noseBase: [98, 97, 2, 326, 327],
  leftIris: [468, 469, 470, 471, 472, 468],
  rightIris: [473, 474, 475, 476, 477, 473],
};

// Convert chains into pairs of indices [start, end]
export function buildConnectionPairs(chains: number[][]): [number, number][] {
  const pairs: [number, number][] = [];
  chains.forEach((chain) => {
    for (let i = 0; i < chain.length - 1; i++) {
      pairs.push([chain[i], chain[i + 1]]);
    }
  });
  return pairs;
}

export const FACIAL_CONTOURS_CONNECTIONS: [number, number][] = [
  ...buildConnectionPairs([CONTOUR_CHAINS.faceOval]),
  ...buildConnectionPairs([CONTOUR_CHAINS.lipsOuter]),
  ...buildConnectionPairs([CONTOUR_CHAINS.lipsInner]),
  ...buildConnectionPairs([CONTOUR_CHAINS.leftEye]),
  ...buildConnectionPairs([CONTOUR_CHAINS.rightEye]),
  ...buildConnectionPairs([CONTOUR_CHAINS.leftEyebrow]),
  ...buildConnectionPairs([CONTOUR_CHAINS.rightEyebrow]),
  ...buildConnectionPairs([CONTOUR_CHAINS.noseBridge]),
  ...buildConnectionPairs([CONTOUR_CHAINS.noseBase]),
  ...buildConnectionPairs([CONTOUR_CHAINS.leftIris]),
  ...buildConnectionPairs([CONTOUR_CHAINS.rightIris]),
];

// Key landmarks with human-readable semantic anatomical names
export const KEY_LANDMARK_NAMES: Record<number, string> = {
  0: 'Upper Lip Top',
  1: 'Nose Tip',
  2: 'Subnasale (Nose Bottom)',
  4: 'Nose Bridge Mid',
  6: 'Glabella (Between Eyebrows)',
  10: 'Forehead Top',
  13: 'Upper Lip Inner',
  14: 'Lower Lip Inner',
  17: 'Lower Lip Bottom',
  33: 'Left Eye Outer Corner',
  61: 'Mouth Left Corner',
  70: 'Left Eyebrow Inner',
  105: 'Left Eyebrow Arch',
  107: 'Left Eyebrow Outer',
  133: 'Left Eye Inner Corner',
  145: 'Left Eye Lower Mid',
  152: 'Chin Bottom',
  159: 'Left Eye Upper Mid',
  168: 'Nasion (Top of Nose)',
  234: 'Left Cheek Outer Boundary',
  263: 'Right Eye Outer Corner',
  291: 'Mouth Right Corner',
  300: 'Right Eyebrow Outer',
  334: 'Right Eyebrow Arch',
  336: 'Right Eyebrow Inner',
  362: 'Right Eye Inner Corner',
  374: 'Right Eye Lower Mid',
  386: 'Right Eye Upper Mid',
  454: 'Right Cheek Outer Boundary',
  468: 'Left Pupil / Iris Center',
  473: 'Right Pupil / Iris Center',
};

// Region classification for filtering and inspector
export function getLandmarkRegion(index: number): string {
  if (index >= 468 && index <= 472) return 'Left Iris';
  if (index >= 473 && index <= 477) return 'Right Iris';
  if (CONTOUR_CHAINS.lipsOuter.includes(index) || CONTOUR_CHAINS.lipsInner.includes(index)) return 'Lips';
  if (CONTOUR_CHAINS.leftEye.includes(index)) return 'Left Eye';
  if (CONTOUR_CHAINS.rightEye.includes(index)) return 'Right Eye';
  if (CONTOUR_CHAINS.leftEyebrow.includes(index)) return 'Left Eyebrow';
  if (CONTOUR_CHAINS.rightEyebrow.includes(index)) return 'Right Eyebrow';
  if (CONTOUR_CHAINS.noseBridge.includes(index) || CONTOUR_CHAINS.noseBase.includes(index)) return 'Nose';
  if (CONTOUR_CHAINS.faceOval.includes(index)) return 'Face Contour';
  return 'Facial Mesh';
}
