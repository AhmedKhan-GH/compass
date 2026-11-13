A decoder often recognizes a family of words while ignoring a few fields. Verilog `casez` treats `?` and `z` bits as wildcards in **both** the case item and the expression being examined. It does not treat `x` as a wildcard by itself.

A mail sorter might recognize `4'b10??`: the upper two bits identify a category, while the lower two bits can be anything. In that pattern, lower-bit `x` values also match because the corresponding pattern positions are explicitly ignored. An `x` in a required upper bit does not match.

```verilog
always @* begin
    casez (destination)
        4'b10??: shelf = 2'd1;
        4'b11??: shelf = 2'd2;
        default: shelf = 2'd0;
    endcase
end
```

An input `z` can also be ignored at a position where the pattern **requires a particular bit**: this is part of `casez` semantics, not proof that a real disconnected line carries a valid category. If several case items match, the first matching item wins.

`casex` goes further and treats `x` as a wildcard too. That can make a decoder appear to recognize a valid command even though a required input bit is unknown. Choose a wildcard case only when you want that matching behavior.

For a simulation diagnostic, reduction XOR (`^word`) is 0 or 1 if every bit is known, and `x` if any bit is `x` or `z`. Comparing that result with case inequality (`!==`) can report a definite known/unknown answer. This is a simulation check, not a physical unknown-voltage detector. Actual communication hardware needs a defined validity/error protocol.

You will first identify candidates with wildcard patterns, then check whether all the message bits are known before accepting one.
