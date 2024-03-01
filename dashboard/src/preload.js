

const simulatedEvent = new DeviceOrientationEvent('deviceorientationabsolute', {
    absolute: true,
    alpha: -90,
    beta: 0,
    gamma: 0
});

setInterval(() => {
    window.dispatchEvent(simulatedEvent);
}, 500);