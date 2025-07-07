@===============================================
@ MochaScript Feature Coverage Test
@===============================================

@---- Variables & Mutability ----
def x = 5;                   @ immutable integer
def mut y = 3;                   @ mutable integer
writeln("x = "); write(x); writeln("");   
writeln("y initial = "); write(y); writeln("");

y = y + 7;                   @ reassign mutable variable
writeln("y after mutation = "); writeln(y);

@---- Arithmetic & Comparisons ----
def sum = x + y * 2 - (y / 5) % 3 ^ 2;
writeln("sum = "); writeln(sum);

def isBig    = sum > 20;
def isEqual  = sum == 19;
def isSmall  = sum < 10;
writeln("isBig = "); writeln(isBig);
writeln("isEqual = "); writeln(isEqual);
writeln("isSmall = "); writeln(isSmall);

@---- Booleans & If/Elif/Else ----
if isBig {
  writeln("Branch: sum is big");
} elif isEqual {
  writeln("Branch: sum equals 19");
} else {
  writeln("Branch: sum is small or medium");
}

@---- For Loop ----
for(def i = 0; i < 5; i = i + 1) {
  write("Loop iteration i = "); writeln(i);
}

@---- Strings & Concatenation ----
def greeting = "Hello";
def name     = "MochaScript";
writeln(greeting + ", " + name + "!");

@---- Comments ----
@ This entire line is a comment and should be ignored by the lexer/parser

@---- Return (exit code) ----
ret 0;   @ should terminate execution with code 0
