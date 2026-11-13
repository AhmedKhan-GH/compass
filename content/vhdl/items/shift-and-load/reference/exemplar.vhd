library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port (clk, reset, load, shift, serial_in : in std_logic;
    parallel_in : in std_logic_vector(7 downto 0);
    pattern : out std_logic_vector(7 downto 0));
end entity;
architecture rtl of top_module is
    signal pattern_r:std_logic_vector(7 downto 0):=(others=>'0');
    begin
    pattern<=pattern_r;
    process(clk) begin if rising_edge(clk) then if reset='1' then pattern_r<=(others=>'0');
    elsif load='1' then pattern_r<=parallel_in;
    elsif shift='1' then pattern_r<=pattern_r(6 downto 0)&serial_in;
    end if;
end if;
end process;
end architecture;
