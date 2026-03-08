export const DEFAULT_CODE = `const init: PlayerInit = (robots, world): void => {
  robots.forEach((robot, index) => {
    robot.setLabel(\`Bot \${index + 1}\`);

    robot.onIdle(() => assignWork(robot));

    robot.onStop((stop) => {
      robot.dropOff();
      robot.pickUp();
      assignWork(robot);
    });

    world.onCargoReady((_cargo) => {
      if (robot.isIdle()) {
        assignWork(robot);
      }
    });

    function assignWork(robot: RobotController) {
      if (robot.hasCargo()) {
        const next = robot.getNextDeliveryStop();
        if (next !== null) {
          robot.goTo(next);
          return;
        }
      }

      const aisle = world.getNearestAisleWithWaiting(robot.getCurrentStop() ?? 0);
      if (aisle) {
        robot.goTo(aisle.stop);
      }
    }
  });
};`;
