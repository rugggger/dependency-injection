//
// Constructors that can be called to instantiate singletons.
//
const singletonConstructors = new Map<string, Function>();

//
// Collection of all singletons objects that can be injected.
//
const instantiatedSingletons = new Map<string, any>();

//
// Manually registers a singleton.
//
export function registerSingleton(dependencyId: string, singleton: any): void {
    instantiatedSingletons.set(dependencyId, singleton);
}

export function instantiateSingleton<T = any>(dependencyId: string): T {
    console.log(`trying to instantiate ${dependencyId}`)
    try {
        const existingSingleton = instantiatedSingletons.get(dependencyId);
        if (existingSingleton) {
            // The singleton has previously been instantiated.
            return existingSingleton;
        }


        const singletonConstructor = singletonConstructors.get(dependencyId);
        if (!singletonConstructor) {
            // The requested constructor was not found. 
            const msg = "No constructor found for singleton " + dependencyId;
            throw new Error(msg);
        }


        // Construct the singleton.
        const instantiatedSingleton = 
            Reflect.construct(makeConstructorInjectable(singletonConstructor), []);

        // Cache the instantiated singleton for later reuse.
        instantiatedSingletons.set(dependencyId, instantiatedSingleton);
        return instantiatedSingleton;
    }
    catch (err) {
        console.error("Failed to instantiate singleton " + dependencyId);
        console.error(err && err.stack || err);
        throw err;
    }
}


function resolvePropertyDependencies(obj: any, injections: any[]): void {

    if (injections) {
        for (const injection of injections) {
            console.log(`attempting to resolve ${injection}`)
            const dependencyId = injection[1];

            // Creates a new dependency instance or reuses the existing one.
            const singleton = instantiateSingleton(dependencyId);
            if (!singleton) {
                throw new Error("Failed to instantiate singleton " + dependencyId);
            }

            const propertyName = injection[0];

            // Inject the dependency into the object.
            obj[propertyName] = singleton; 
        }
    }
}

//
// Takes a constructor and makes it 'injectable'.
// Wraps the constructor in a proxy that handles injecting dependencies.
//
function makeConstructorInjectable(origConstructor: Function): Function {

    console.log('makeConstructorInjectable')

    if (!origConstructor.prototype.__injections__) {
        // Record properties to be injected against the constructor prototype.
        origConstructor.prototype.__injections__ = []; 
    }

    const proxyHandler: any = {  
        // Intercepts the call to the original class constructor.

         construct(target: any, args: any[], newTarget: any) {
            console.log('calling contruct')  
            // Construct the object ...
            const obj = Reflect.construct(target, args, newTarget);
            try {
                // ... and then resolve property dependencies.
                const injections = origConstructor.prototype.__injections__ ;
                resolvePropertyDependencies(obj, injections);
            }
            catch (err) {
                // ... log the error ...
                console.log('error here')
                throw err;
            }
        
            return obj;
        }
        
    };

    // Wrap the original constructor in a proxy.
    // Use the proxy to inject dependencies.
    // Returns the proxy constructor to use in place of the original constructor.
    return new Proxy(origConstructor, proxyHandler);
}

//
// TypeScript decorator: Marks a class as injectable.
//
export function InjectableClass(): Function {
    // Returns a factory function that creates a proxy constructor.
    return makeConstructorInjectable;
}

export function InjectProperty(dependencyId: string): Function {
    // Returns a function that is invoked for the property that is to be injected.
    return (prototype: any, propertyName: string): void => {
        if (!prototype.__injections__) {
            // Record properties to be injected against the constructor prototype.
            prototype.__injections__ = [];
        }

        // Record injections to be resolved later when an instance is created.
        prototype.__injections__.push([ propertyName, dependencyId ]);
    };
}

//
// TypeScript decorator: Marks a class as an automatically 
// created singleton that's available for injection.
//
export function InjectableSingleton(dependencyId: string): Function {
    // Returns a factory function that records the constructor of the class so that
    // it can be lazily created later as a singleton when required as a dependency.
    return (target: Function): void => {
        // Adds the singleton constructor to the set of singletons.
        singletonConstructors.set(dependencyId, target);
    }
}
