library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    generic(WIDTH:positive:=7;
    WARNING_AT:natural:=6);
    port(clk,reset,arrival:in std_logic;
    visitors:out std_logic_vector(WIDTH-1 downto 0);
    busy:out std_logic);
end entity;
architecture rtl -- Complete the TODOs in this starter.
    of top_module is
    signal count_i:std_logic_vector(WIDTH-1 downto 0);
    begin
    counter:entity work.trail_counter generic map(WIDTH=>WIDTH)port map(clk,reset,arrival,count_i);
    indicator:entity work.trail_indicator generic map(WIDTH=>WIDTH,WARNING_AT=>WARNING_AT)port map(count_i,busy);
    visitors<=count_i;
end architecture;
