import React, { Suspense, lazy } from 'react';
import { hasWebGL } from './webgl';

const SceneBackground = lazy(() => import('./SceneBackground'));
const HeroScene = lazy(() => import('./HeroScene'));

/** Silent boundary: if WebGL crashes, the site simply falls back to the flat UI. */
class Silent extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err) {
    console.warn('[3D] scene disabled:', err?.message || err);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * Lazy-loaded WebGL scene. kind: "background" | "hero".
 * three.js ships in its own chunk, so the first paint is not blocked.
 */
const Scene3D = ({ kind = 'background' }) => {
  if (!hasWebGL()) return null;
  const Comp = kind === 'hero' ? HeroScene : SceneBackground;
  return (
    <Silent>
      <Suspense fallback={null}>
        <Comp />
      </Suspense>
    </Silent>
  );
};

export default Scene3D;
