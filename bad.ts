
import "typescript";

export class Bad {
    private something: number = 1;
    public name(a: number, b: any): void {
        function apple() {
            // This is fine
            var c: number = 1;
        };
        function banana() {
            // This is bad
            this.something = b.type;
            var d: number = a;
            d = arguments.length;
            d = d + 1;
        };
    }

}

