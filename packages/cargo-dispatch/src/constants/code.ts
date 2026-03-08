export const DEFAULT_CODE = `const init: PlayerInit = (world) => {
  const stops = [
    ...world.getTrucks().map((t) => t.id),
    ...world.getAisles().map((a) => a.id),
  ].sort((a, b) => a - b);

  world.getRobots().forEach((robot) => {
    let forward = true;

    function startLeg() {
      const leg = forward ? stops : [...stops].reverse();
      leg.forEach((s) => robot.goTo(s));
      forward = !forward;
    }

    robot.onStop(() => {
      robot.dropOff();
      robot.pickUp();
    });

    robot.onIdle(startLeg);

    startLeg();
  });
};`;
