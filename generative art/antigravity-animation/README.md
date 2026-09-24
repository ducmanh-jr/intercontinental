# Antigravity Animation

A collection of customizable "Antigravity" animations that replicate the feeling of weightless, floating geometric shapes often found in Google's design language. These animations are fully customizable via URL parameters and optimized for high performance using GPU acceleration.

## Files

### `antigravity-basic.html`

The basic antigravity animation with customizable physics and visual parameters. Features:

- Customizable particle count, speed, colors, and shapes
- Configurable gravity/antigravity direction
- Mouse/touch interaction (particles repel from cursor)
- Smooth physics simulation with friction and depth effects
- High DPI display support

### `antigravity-pattern.html`

An enhanced version with pattern formation capabilities and GPU-optimized rendering. Features:

- All features from `antigravity-basic.html`
- **Pattern mode**: Arrange particles into geometric formations (circle, square, triangle)
- **GPU-accelerated rendering**: Uses sprite caching and optimized canvas operations
- Pre-rendered shapes with baked shadows for maximum performance
- Optimized for 60/120fps even on mobile devices with high particle counts

## How to Use

Both animations are controlled completely via URL parameters. Simply open the HTML file in a browser and add parameters to customize the animation.

### URL Parameters

| Parameter | Description | Example | Default |
|-----------|-------------|---------|---------|
| `speed` | Speed multiplier | `?speed=0.5` (slow), `?speed=3` (fast) | `0.8` |
| `bg` | Background hex color (without `#`) | `?bg=000000` (black), `?bg=ffffff` (white) | `#ffffff` |
| `fill` | Comma-separated list of hex colors for shapes | `?fill=ff0000,00ff00,0000ff` | Google colors |
| `shape` | Type of particles | `circle`, `square`, `triangle`, or `mixed` | `mixed` |
| `gravity` | Gravity direction and force | `?gravity=0.2` (down), `?gravity=-0.1` (up/antigravity) | `-0.05` |
| `count` | Number of shapes/particles | `?count=100` | `45` |
| `pattern` | Enable pattern formation (pattern.html only) | `?pattern=true` | `false` |

### Examples

**Dark Mode with Triangles:**
```
?bg=222222&fill=ffffff,555555&shape=triangle
```

**Confetti Celebration:**
```
?count=150&gravity=0.3&speed=2&shape=mixed
```

**Pattern Formation (pattern.html only):**
```
?pattern=true&shape=triangle&count=60
```

**Slow Floating Circles:**
```
?shape=circle&gravity=-0.1&speed=0.5&count=80
```

## Pattern Mode (antigravity-pattern.html only)

When `pattern=true` is enabled, particles will arrange themselves into a large geometric formation:

- **Circle shape**: Particles form a circular pattern
- **Square shape**: Particles form a square pattern
- **Triangle shape**: Particles form a triangular pattern
- **Mixed shape**: Defaults to circular pattern

The pattern uses spring physics to smoothly guide particles into position while maintaining natural movement.

## Performance

### antigravity-basic.html
- Uses standard canvas 2D rendering
- Optimized for up to ~100 particles at 60fps
- Best for simple animations and lower-end devices

### antigravity-pattern.html
- **GPU-accelerated** using sprite caching
- Pre-rendered shapes with baked shadows
- Optimized canvas context settings (`desynchronized`, `willReadFrequently: false`)
- High-quality image smoothing
- Can handle 200+ particles at 60fps on modern devices
- Uses `requestAnimationFrame` with proper frame timing

## Technical Details

### Physics Engine
- Custom JavaScript physics simulation
- Velocity-based movement with friction
- Depth-based scaling for 3D effect
- Mouse/touch interaction with repulsion force
- Boundary wrapping or reset behavior

### Rendering (pattern.html)
- **Sprite Caching**: Each unique shape/color combination is pre-rendered to an offscreen canvas
- **GPU Textures**: Uses `drawImage()` which browsers optimize to GPU textures
- **Shadow Baking**: Expensive shadow effects are computed once and baked into sprites
- **High DPI Support**: Automatically scales for retina displays

## Browser Compatibility

- Modern browsers with Canvas 2D support
- Mobile browsers (iOS Safari, Chrome Mobile)
- Requires JavaScript enabled

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0). See [LICENSE.md](LICENSE.md) for details.

## Credits

Inspired by Google's Material Design animations and antigravity effects shown in https://antigravity.google/auth-success

