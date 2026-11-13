library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port (
        clk, reset, start : in std_logic;
        a, b : in std_logic_vector(7 downto 0);
        busy, done : out std_logic;
        product : out std_logic_vector(15 downto 0)
    );
end entity;

architecture rtl of top_module is
begin
    busy <= '0';
    done <= '0';
    product <= (others => '0'); -- TODO: perform one shift-add step per cycle
end architecture;
