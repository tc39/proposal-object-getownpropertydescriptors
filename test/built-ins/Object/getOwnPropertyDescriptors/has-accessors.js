var a = {get a() {}};
var b = Object.getOwnPropertyDescriptors(a);


assert(b.a.get === Object.getOwnPropertyDescriptor(a, 'a').get,
    'Expected descriptors.a.get to be exact same of Object.getOwnPropertyDescriptor(object, "a").get');