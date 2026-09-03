/**
 * the physics behind every gesture in the app.
 *
 * these are worth asserting because all four functions are silently wrong in
 * ways you cannot see in a screenshot: a spring converted with the wrong
 * formula still animates, a projection with the textbook decay still lands
 * *somewhere*, and a velocity handed over in the wrong unit just looks like a
 * sheet that is a bit sluggish. the feel is the spec, so the spec gets tests.
 *   npm run test:motion
 */
import { spring, SPRING, project, snapTo, rubberband, handoff } from './motion';

const fail: string[] = [];
const near = (label: string, got: number, want: number, tol = 0.001) => {
  if (!(Math.abs(got - want) <= tol)) fail.push(`${label}: got ${got} want ~${want}`);
};
const eq = (label: string, got: unknown, want: unknown) => {
  if (got !== want) fail.push(`${label}: got ${got} want ${want}`);
};
const ok = (label: string, cond: boolean) => {
  if (!cond) fail.push(label);
};

/* ---------------------------------------------- damping + response round-trip */

// every preset must survive the conversion: read the physics back out of the
// react native config and you should get the two numbers we asked for.
for (const [name, spec] of Object.entries(SPRING)) {
  const { stiffness: k, damping: c, mass: m } = spring(spec);
  const w = Math.sqrt(k / m); // natural frequency
  near(`${name} response`, (2 * Math.PI) / w, spec.response);
  near(`${name} damping ratio`, c / (2 * Math.sqrt(k * m)), spec.damping);
}

// the defaults are the point of the whole file: nothing bounces unless a
// gesture threw it.
ok('ui does not overshoot', SPRING.ui.damping >= 1);
ok('press does not overshoot', SPRING.press.damping >= 1);
ok('move does not overshoot', SPRING.move.damping >= 1);
ok('sheet overshoots', SPRING.sheet.damping < 1);
ok('flick overshoots', SPRING.flick.damping < 1);

/* --------------------------------------------------------------- unit handoff */

// PanResponder reports px/ms, Animated.spring wants px/s. getting this wrong
// is a 1000x error that reads as "the sheet ignores how hard you threw it".
near('half a px per ms is 500 px/s', handoff(0.5), 500);
near('a still finger stays still', handoff(0), 0);

/* ----------------------------------------------------------------- projection */

// apple's exponential-decay form, not v^2/(2a). at the default rate a metre
// per second of release travels 499px before it stops.
near('1000 px/s projects 499px', project(1000), 499, 0.5);
near('nothing projects nowhere', project(0), 0);
ok('upward velocity projects upward', project(-1000) < 0);
ok('a snappier rate travels less', Math.abs(project(1000, 0.99)) < Math.abs(project(1000, 0.998)));
ok('projection is proportional to speed', project(2000) > project(1000));

/* ------------------------------------------------------- reverse or commit */

const H = 400; // a sheet 400px tall; 0 is open, 400 is dismissed

eq('barely moved, released still -> stays', snapTo(20, 0, [0, H]), 0);
eq('dragged past halfway, released still -> goes', snapTo(250, 0, [0, H]), H);
// the two cases position alone gets wrong, and the reason projection exists:
eq('barely moved but flicked hard -> goes', snapTo(60, 1200, [0, H]), H);
eq('nearly dismissed but thrown back -> stays', snapTo(300, -1200, [0, H]), 0);
// a lazy drift is not a flick
eq('slow drift below halfway -> stays', snapTo(120, 60, [0, H]), 0);

/* ------------------------------------------------------------- rubber-banding */

const dim = 400;
ok('resistance always gives less than you pull', rubberband(100, dim) < 100);
ok('and never nothing at all', rubberband(100, dim) > 0);
ok('it is monotonic', rubberband(200, dim) > rubberband(100, dim));
// the point of the curve: doubling the pull does far less than double the give
ok('resistance grows with distance', rubberband(200, dim) < 2 * rubberband(100, dim));
near('no overshoot, no offset', rubberband(0, dim), 0);
ok('it saturates rather than running away', rubberband(10000, dim) < dim);

if (fail.length) {
  console.error(`motion: ${fail.length} failure(s)`);
  for (const f of fail) console.error('  ' + f);
  process.exit(1);
}
console.log('motion: ok');
