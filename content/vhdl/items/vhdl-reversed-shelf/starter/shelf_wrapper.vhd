use work.shelf_tools.all;
entity shelf_wrapper is
    port (
    asc_left   : out   integer;
    asc_right  : out   integer;
    asc_len    : out   integer;
    asc_total  : out   integer;
    desc_left  : out   integer;
    desc_right : out   integer;
    desc_len   : out   integer;
    desc_total : out   integer
    );
end entity shelf_wrapper;
architecture sim of shelf_wrapper is
    constant a : shelf_t(3 to 5) := (4, 7, 9);
    constant d : shelf_t(7 downto 4) := (2, 3, 5, 8);
    begin
    asc_left <= first_label(a);
    asc_right <= last_label(a);
    asc_len <= slot_count(a);
    asc_total <= stock_total(a);
    desc_left <= first_label(d);
    desc_right <= last_label(d);
    desc_len <= slot_count(d);
    desc_total <= stock_total(d);
end architecture sim;
