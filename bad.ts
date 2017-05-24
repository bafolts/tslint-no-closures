
import "typescript";

declare var global;

export class Bad {
    private something: number = 1;
    public name(a: number, b: any): void {
        for (var i = 0; i < 100; i++) {
            global.setTimeout(() => {
                global.console.log(i);
            });
        }
    }

}

