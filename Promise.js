class Promise {
    callbacks = [];
    state = 'pending';
    value = null;
    constructor(fn) {
        fn(this._resolve.bind(this), this._reject.bind(this));
    }

    then(onFulfilled, onRejected) {
        return new Promise((resolve, reject) => {
            this._handle({
                onFulfilled: onFulfilled || null,
                onRejected: onRejected || null,
                resolve: resolve,
                reject: reject
            })
        })
    }

    catch(onError) {
        return this.then(null, onError);
    }

    finally(onDone) {
        if (typeof onDone !== 'function') {
            return this.then();
        }

        return this.then(
            value => Promise.resolve(onDone()).then(() => value),
            reason => Promise.resolve(onDone()).then(() => { throw reason })
        );
    }

    _handle(callback) {
        if (this.state === 'pending') {
            this.callbacks.push(callback);
            return;
        }

        let cb = this.state === 'fulfilled' ? callback.onFulfilled : callback.onRejected;

        if (!cb) {
            cb = this.state === 'fulfilled' ? callback.resolve : callback.reject;
            cb(this.value);
            return;
        }

        let ret;
        try {
            ret = cb(this.value);
            cb = this.state === 'fulfilled' ? callback.resolve : cb.reject;
        } catch (error) {
            ret = error;
            cb = callback.reject;
        } finally {
            cb(ret);
        }
    }

    _resolve(value) {
        if (value instanceof Promise) {
            value.then(this._resolve.bind(this), this._reject.bind(this));
            return;
        }

        if (this.state !== 'pending') {
            return;
        }

        this.state = 'fulfilled';
        this.value = value;
        this.callbacks.forEach(callback => this._handle(callback));
    }

    _reject(error) {
        if (this.state !== 'pending') {
            return;
        }
        this.state = 'rejected';
        this.value = error;
        this.callbacks.forEach(callback => this._handle(callback));
    }

    static resolve(value) {
        if (value && value instanceof Promise) {
            return value;
        }

        if (value && typeof value === 'object' && typeof value.then === 'function') {
            let then = value.then;
            return new Promise(resolve => then(resolve));
        }

        if (value) {
            return new Promise(resolve => resolve(value));
        }

        return new Promise(resolve => resolve());
    }

    static all(promises) {
        return new Promise((resolve, reject) => {
            let fulfillCount = 0;
            let itemLength = promises.length;
            let results = Array.from({length: itemLength});

            promises.forEach((promise, index) => {
                Promise.resolve(promise).then((res) => {
                    results[index] = res;
                    fulfillCount++;
                    if (fulfillCount == itemLength) {
                        resolve(results);
                    }
                }, reason => reject(reason))
            });
        })
    }

    static race(promises) {
        return new Promise((resolve, reject) => {
            promises.forEach(promise => {
                promise.then(resolve, reject);
            });
        });
    }
}

let p = new Promise((resolve, reject) => {
    // resolve("123");
    reject("123");
}).then()
  .then(value => {
    console.log(value);
    return new Promise(resolve => {
        resolve(112);
    })
}, (error) => {
      console.log(error);
  }).then(value => {
    console.log(value);
    return new Promise((resolve, reject) => {
        reject("456");
    })
}).finally(() => {
    console.log(456);
    console.log(123);
});

// let p1 = new Promise(resolve => {
//     setTimeout(() => {
//         console.log("1s");
//         resolve(1);
//     }, 1000);
// });
//
// let p2 = new Promise(resolve => {
//     setTimeout(() => {
//         console.log("2s");
//         resolve(2);
//     }, 2000);
// });
//
// let p3 = new Promise(resolve => {
//     setTimeout(() => {
//         console.log("3s");
//         resolve(3);
//     }, 3000);
// });
//
//
//
// Promise.all([p1, p2, p3]).then(results => {
//     console.log(results);
// });
//
// Promise.race([p1, p2, p3]).then(result => {
//     console.log(result);
// });