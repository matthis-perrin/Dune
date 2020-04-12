export async function AllPromise<T>(all: Promise<T>[]): Promise<T[]>;
export async function AllPromise<T1>(all: [Promise<T1>]): Promise<[T1]>;
export async function AllPromise<T1, T2>(all: [Promise<T1>, Promise<T2>]): Promise<[T1, T2]>;
export async function AllPromise<T1, T2, T3>(
  all: [Promise<T1>, Promise<T2>, Promise<T3>]
): Promise<[T1, T2, T3]>;
export async function AllPromise<T1, T2, T3, T4>(
  all: [Promise<T1>, Promise<T2>, Promise<T3>, Promise<T4>]
): Promise<[T1, T2, T3, T4]>;
export async function AllPromise<T1, T2, T3, T4, T5>(
  all: [Promise<T1>, Promise<T2>, Promise<T3>, Promise<T4>, Promise<T5>]
): Promise<[T1, T2, T3, T4, T5]>;
export async function AllPromise<T1, T2, T3, T4, T5, T6>(
  all: [Promise<T1>, Promise<T2>, Promise<T3>, Promise<T4>, Promise<T5>, Promise<T6>]
): Promise<[T1, T2, T3, T4, T5, T6]>;
export async function AllPromise<T1, T2, T3, T4, T5, T6, T7>(
  all: [Promise<T1>, Promise<T2>, Promise<T3>, Promise<T4>, Promise<T5>, Promise<T6>, Promise<T7>]
): Promise<[T1, T2, T3, T4, T5, T6, T7]>;
export async function AllPromise<T1, T2, T3, T4, T5, T6, T7, T8>(
  all: [
    Promise<T1>,
    Promise<T2>,
    Promise<T3>,
    Promise<T4>,
    Promise<T5>,
    Promise<T6>,
    Promise<T7>,
    Promise<T8>
  ]
): Promise<[T1, T2, T3, T4, T5, T6, T7, T8]>;
// tslint:disable: no-any
export async function AllPromise(all: Promise<any>[]): Promise<any[]> {
  if (all.length === 0) {
    return Promise.resolve([]);
  }
  return new Promise<any[]>((resolve, reject) => {
    const promiseResults: any[] = [];
    let counter = 0;
    for (let index = 0; index < all.length; index++) {
      const p: Promise<any> = all[index];
      p.then(res => {
        counter++;
        promiseResults[index] = res;
        if (counter === all.length) {
          resolve((promiseResults as unknown) as Promise<any[]>);
        }
      }).catch(reject);
    }
  });
}
// tslint:enable: no-any
