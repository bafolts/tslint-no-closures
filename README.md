# tslint-no-closures
A typescript linting rule to discourage the usage of closures.

*THIS PROJECT IS STILL A WORK IN PROGRESS* 

Closures in javascript can cause memory leaks in certain situations. Most closures can be avoided. This linting rule attempts
to find closures and log them as either warnings or errors in order to help avoid memory leaks.

```
"rules": {
    "no-closures": true
}
```

With this rule enabled, common closure bugs will be marked as errors:

BAD:

```js
for (var i = 0; i < 100; i++) {
    setTimeout(() => {
        // i was not defined in this function
        alert(i);
    });
}
```
