package shelf_tools is

    type shelf_t is array (integer range <>) of integer;

    function first_label (
        values : shelf_t
    ) return integer;

    function last_label (
        values : shelf_t
    ) return integer;

    function slot_count (
        values : shelf_t
    ) return natural;

    function stock_total (
        values : shelf_t
    ) return integer;

end package shelf_tools;

package body shelf_tools is

    function first_label (
        values : shelf_t
    ) return integer is begin return values'left; end function first_label;

    function last_label (
        values : shelf_t
    ) return integer is begin return values'right; end function last_label;

    function slot_count (
        values : shelf_t
    ) return natural is begin return values'length; end function slot_count;

    function stock_total (
        values : shelf_t
    ) return integer is variable total : integer := 0; begin for i in values'range loop

            total := total + values(i);

        end loop; return total; end function stock_total;

end package body shelf_tools;
