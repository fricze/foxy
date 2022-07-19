interface Action {
    at?: number;
    run: () => void;
}

interface ScheduledAction extends Required<Action> { };

class Scheduler {
    actions: ScheduledAction[] = [];
    time: number = performance.now();

    run() {
        const runActions = this.actions
            .filter(({ at }) => at <= this.time)

        runActions.forEach(({ run }) => run())

        this.actions = this.actions
            .filter(({ at }) => at > this.time)
    }

    schedule(a: Action) {
        const scheduledAction = a.at ? a as ScheduledAction : { ...a, at: this.time };
        this.actions.push(scheduledAction);
    }
}

class Value<T> {
    readonly current: T;

    constructor(v: T) {
        this.current = v;
    }
}

class Observable<T> {
    value: Value<T>;

    constructor(v: T) {
        this.value = new Value(v);
    }

    next(v: T) {
        this.value = new Value(v);
    }
}

class Observer { }

class VirtualScheduler extends Scheduler {
    time: number = 0;

    tick() {
        this.time++;
        this.run();
    }
}

const s = new VirtualScheduler();
s.schedule({ run: () => console.log('im an action') })
s.schedule({ at: 5, run: () => console.log('im an actionzzz') })

console.log(s.actions)
s.run();

console.log(s.actions)
s.tick(); s.tick();
console.log(s.actions)
s.tick(); s.tick(); s.tick(); s.tick();
console.log(s.actions)
