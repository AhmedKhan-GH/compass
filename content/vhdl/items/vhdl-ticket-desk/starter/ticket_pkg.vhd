package ticket_pkg is
    type ticket_desk_t is protected
        procedure reset;
        procedure issue;
        procedure serve;
        impure function issued return natural;
        impure function served return natural;
        impure function waiting return natural;
    end protected ticket_desk_t;
end package ticket_pkg;

package body ticket_pkg is
    type ticket_desk_t is protected body
        variable issued_count : natural := 0;
        variable served_count : natural := 0;
        variable waiting_count : natural := 0;

        procedure reset is
        begin
            -- TODO: clear the three private counts.
            null;
        end procedure;

        procedure issue is
        begin
            -- TODO: record a newly issued ticket.
            null;
        end procedure;

        procedure serve is
        begin
            -- TODO: serve a waiting customer without underflow.
            null;
        end procedure;

        impure function issued return natural is
        begin
            return 0; -- TODO: return the corresponding private count.
        end function;

        impure function served return natural is
        begin
            return 0; -- TODO: return the corresponding private count.
        end function;

        impure function waiting return natural is
        begin
            return 0; -- TODO: return the corresponding private count.
        end function;
    end protected body ticket_desk_t;
end package body ticket_pkg;
