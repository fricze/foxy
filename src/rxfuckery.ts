import './console.time';
import { identity, of, scheduled, SchedulerAction, Subscription, UnaryFunction, VirtualAction, VirtualTimeScheduler } from 'rxjs';
import { delay, filter, map, observeOn, throttleTime, tap, share } from 'rxjs/operators';
import { AsyncScheduler } from 'rxjs/internal/scheduler/AsyncScheduler';
import { AsyncAction } from 'rxjs/internal/scheduler/AsyncAction';
import { operate } from 'rxjs/internal/util/lift';
import { createOperatorSubscriber } from 'rxjs/internal/operators/OperatorSubscriber';
import { TapObserver } from 'rxjs/internal/operators/tap';
import { TestScheduler } from 'rxjs/testing';
import { intersperse } from 'fp-ts/lib/Array';

class MyAction<T> extends VirtualAction<T> {
    public schedule(state?: T, delay: number = 0): Subscription {
        console.log('SCHEDULE')
        console.trace(state)
        if (Number.isFinite(delay)) {
            if (!this.id) {
                return super.schedule(state, delay);
            }
            this.active = false;
            // If an action is rescheduled, we save allocations by mutating its state,
            // pushing it to the end of the scheduler queue, and recycling the action.
            // But since the VirtualTimeScheduler is used for testing, VirtualActions
            // must be immutable so they can be inspected later.
            const action = new VirtualAction(this.scheduler, this.work);
            this.add(action);
            return action.schedule(state, delay);
        } else {
            // If someone schedules something with Infinity, it'll never happen. So we
            // don't even schedule it.
            return Subscription.EMPTY;
        }
    }
}

class MyScheduler extends VirtualTimeScheduler {
    public flushOne(): void {
        const { actions, maxFrames } = this;
        let error: any;
        let action: AsyncAction<any> | undefined;

        while ((action = actions[0]) && action.delay <= maxFrames) {
            actions.shift();
            this.frame = action.delay;

            if ((error = action.execute(action.state, action.delay))) {
                break;
            }
        }

        if (error) {
            while ((action = actions.shift())) {
                action.unsubscribe();
            }
            throw error;
        }
    }

    public flush(): void {
        const { actions, maxFrames } = this;
        let error: any;
        let action: AsyncAction<any> | undefined;

        while ((action = actions[0]) && action.delay <= maxFrames) {
            actions.shift();
            this.frame = action.delay;

            if ((error = action.execute(action.state, action.delay))) {
                break;
            }
        }

        if (error) {
            while ((action = actions.shift())) {
                action.unsubscribe();
            }
            throw error;
        }
    }
    // public schedule<T>(
    //     work: (this: SchedulerAction<T>, state?: T) => void,
    //     delay: number = 0,
    //     state?: T
    // ): Subscription {
    //     return super.schedule(work, delay + 5, state);
    // }

    // public _active: boolean = false;

    // public flush(action: AsyncAction<any>): void {
    //     const { actions } = this;

    //     if (this._active) {
    //         actions.push(action);
    //         return;
    //     }

    //     let error: any;
    //     this._active = true;

    //     do {
    //         if ((error = action.execute(action.state, action.delay))) {
    //             break;
    //         }
    //     } while ((action = actions.shift()!)); // exhaust the scheduler queue

    //     this._active = false;

    //     if (error) {
    //         while ((action = actions.shift()!)) {
    //             action.unsubscribe();
    //         }
    //         throw error;
    //     }
    // }
}


export function pipe(): typeof identity;
export function pipe<T, A>(fn1: UnaryFunction<T, A>): UnaryFunction<T, A>;
export function pipe<T, A, B>(fn1: UnaryFunction<T, A>, fn2: UnaryFunction<A, B>): UnaryFunction<T, B>;
export function pipe<T, A, B, C>(fn1: UnaryFunction<T, A>, fn2: UnaryFunction<A, B>, fn3: UnaryFunction<B, C>): UnaryFunction<T, C>;
export function pipe<T, A, B, C, D>(
    fn1: UnaryFunction<T, A>,
    fn2: UnaryFunction<A, B>,
    fn3: UnaryFunction<B, C>,
    fn4: UnaryFunction<C, D>
): UnaryFunction<T, D>;
export function pipe<T, A, B, C, D, E>(
    fn1: UnaryFunction<T, A>,
    fn2: UnaryFunction<A, B>,
    fn3: UnaryFunction<B, C>,
    fn4: UnaryFunction<C, D>,
    fn5: UnaryFunction<D, E>
): UnaryFunction<T, E>;
export function pipe<T, A, B, C, D, E, F>(
    fn1: UnaryFunction<T, A>,
    fn2: UnaryFunction<A, B>,
    fn3: UnaryFunction<B, C>,
    fn4: UnaryFunction<C, D>,
    fn5: UnaryFunction<D, E>,
    fn6: UnaryFunction<E, F>
): UnaryFunction<T, F>;
export function pipe<T, A, B, C, D, E, F, G>(
    fn1: UnaryFunction<T, A>,
    fn2: UnaryFunction<A, B>,
    fn3: UnaryFunction<B, C>,
    fn4: UnaryFunction<C, D>,
    fn5: UnaryFunction<D, E>,
    fn6: UnaryFunction<E, F>,
    fn7: UnaryFunction<F, G>
): UnaryFunction<T, G>;
export function pipe<T, A, B, C, D, E, F, G, H>(
    fn1: UnaryFunction<T, A>,
    fn2: UnaryFunction<A, B>,
    fn3: UnaryFunction<B, C>,
    fn4: UnaryFunction<C, D>,
    fn5: UnaryFunction<D, E>,
    fn6: UnaryFunction<E, F>,
    fn7: UnaryFunction<F, G>,
    fn8: UnaryFunction<G, H>
): UnaryFunction<T, H>;
export function pipe<T, A, B, C, D, E, F, G, H, I>(
    fn1: UnaryFunction<T, A>,
    fn2: UnaryFunction<A, B>,
    fn3: UnaryFunction<B, C>,
    fn4: UnaryFunction<C, D>,
    fn5: UnaryFunction<D, E>,
    fn6: UnaryFunction<E, F>,
    fn7: UnaryFunction<F, G>,
    fn8: UnaryFunction<G, H>,
    fn9: UnaryFunction<H, I>
): UnaryFunction<T, I>;
export function pipe<T, A, B, C, D, E, F, G, H, I>(
    fn1: UnaryFunction<T, A>,
    fn2: UnaryFunction<A, B>,
    fn3: UnaryFunction<B, C>,
    fn4: UnaryFunction<C, D>,
    fn5: UnaryFunction<D, E>,
    fn6: UnaryFunction<E, F>,
    fn7: UnaryFunction<F, G>,
    fn8: UnaryFunction<G, H>,
    fn9: UnaryFunction<H, I>,
    ...fns: UnaryFunction<any, any>[]
): UnaryFunction<T, unknown>;

/**
 * pipe() can be called on one or more functions, each of which can take one argument ("UnaryFunction")
 * and uses it to return a value.
 * It returns a function that takes one argument, passes it to the first UnaryFunction, and then
 * passes the result to the next one, passes that result to the next one, and so on.  
 */
export function pipe(...fns: Array<UnaryFunction<any, any>>): UnaryFunction<any, any> {
    return pipeFromArray(fns);
}

(window as unknown as { taps: any[] }).taps = []

const fuckedTap = <T>(
    observerOrNext?: ((value: T) => void) | null,
    error?: ((e: any) => void) | null,
    complete?: (() => void) | null
) => {
    const tapObserver =
        ({ next: observerOrNext as Exclude<typeof observerOrNext, Partial<TapObserver<T>>>, error, complete } as Partial<TapObserver<T>>)

    return operate((source, subscriber) => {
        tapObserver.subscribe?.();
        let isUnsub = true;

        source.subscribe(
            createOperatorSubscriber(
                subscriber,
                (value) => {
                    tapObserver.next?.({ value, source } as unknown as T);
                    subscriber.next(value);
                },
                () => {
                    isUnsub = false;
                    tapObserver.complete?.();
                    subscriber.complete();
                },
                (err) => {
                    isUnsub = false;
                    tapObserver.error?.(err);
                    subscriber.error(err);
                },
                () => {
                    if (isUnsub) {
                        tapObserver.unsubscribe?.();
                    }
                    tapObserver.finalize?.();
                }
            )
        );
    })
}


/** @internal */
export function pipeFromArray<T, R>(fns: Array<UnaryFunction<T, R>>): UnaryFunction<T, R> {
    const myTap = fuckedTap(x => console.log('thats a value ', x)) as unknown as UnaryFunction<T, R>

    if (fns.length === 0) {
        return identity as UnaryFunction<any, any>;
    }

    if (fns.length === 1) {
        return fns[0];
    }

    return function piped(input: T): R {
        return intersperse(myTap)(fns).reduce((prev: any, fn: UnaryFunction<T, R>) => fn(prev), input as any);
    };
}


export const run = () => {
    const myScheduler = new MyScheduler(MyAction);

    pipe(
        map((x: number) => x),
        observeOn(myScheduler),
        delay(200, myScheduler),
        map(x => x + 5),
        delay(200, myScheduler),
        filter(x => x > 3),
        map(x => x + 5),
        delay(300, myScheduler),
    )(of(1))
        .subscribe(v => console.log(v));

    const { actions } = myScheduler
    console.log(actions)
    // console.log(myScheduler.frame)
    // myScheduler.flush()
    // console.log(myScheduler.frame)


    // myScheduler.run((helpers) => {
    //     const { cold, time, expectObservable, expectSubscriptions } = helpers;
    //     const e1 = cold(' -a--b--c---|');
    //     const e1subs = '  ^----------!';
    //     const t = time('   ---|       '); // t = 3
    //     const expected = '-a-----c---|';

    //     expectObservable(e1.pipe(throttleTime(t))).toBe(expected);
    //     expectSubscriptions(e1.subscriptions).toBe(e1subs);
    // });
}
