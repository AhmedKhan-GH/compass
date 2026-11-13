package shelf_tools is type shelf_t is array(integer range <>) of integer; function first_label (
        v:shelf_t
    ) return integer; function last_label (
        v:shelf_t
    ) return integer; function slot_count (
        v:shelf_t
    ) return natural; function stock_total (
        v:shelf_t
    ) return integer; end package shelf_tools; package body shelf_tools is function first_label (
        v:shelf_t
    ) return integer is begin return 0; end function first_label; function last_label (
        v:shelf_t
    ) return integer is begin return v'length - 1; end function last_label; function slot_count (
        v:shelf_t
    ) return natural is begin return v'length; end function slot_count; function stock_total (
        v:shelf_t
    ) return integer is variable n : integer := 0; begin for i in v'range loop

            n := n + v(i);

        end loop; return n; end function stock_total; end package body shelf_tools;
