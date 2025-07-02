@ This is a test of all language features

def message = "Hello GitHub";
writeln("Starting Program...");
writeln(message);

@ Simple arithmetic + write
def x = 2 + 3 * 4;
write("x = "); 
writeln(x);

@ Testing if/elif/else
def val = 7;

if (val < 5) {
  writeln("val is less than 5");
} elif (val == 7) {
  writeln("val is exactly 7");
} else {
  writeln("val is something else");
}

@ Now do a loop
for (def i = 0; i < 5; i = i + 1) {
  write("i = "); writeln(i);
}


@ Assignments
val = 10;
writeln("Updated val:");
writeln(val);


@ String reassignment
def name = "World";
write("Hello, ");
writeln(name);

@ Complex expression
def z = (5 + 3) * 2 ^ 2;
writeln("z = ");
writeln(z);

@ Final return
ret 69;
