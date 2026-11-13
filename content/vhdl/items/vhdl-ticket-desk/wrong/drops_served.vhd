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
            issued_count := 0;
            served_count := 0;
            waiting_count := 0;
        end procedure;

        procedure issue is
        begin
            issued_count := issued_count + 1;
            waiting_count := waiting_count + 1;
        end procedure;

        procedure serve is
        begin
            if waiting_count > 0 then
                served_count := served_count;
                waiting_count := waiting_count - 1;
            end if;
        end procedure;

        impure function issued return natural is
        begin
            return issued_count;
        end function;

        impure function served return natural is
        begin
            return served_count;
        end function;

        impure function waiting return natural is
        begin
            return waiting_count;
        end function;
    end protected body ticket_desk_t;
end package body ticket_pkg;
