library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity selector is
    port (
    a : in std_logic_vector(3 downto 0);
    b : in std_logic_vector(3 downto 0);
    select_b : in std_logic;
    y : out std_logic_vector(3 downto 0)
    );
end entity;
architecture rtl of selector is
    begin
    y <= a;
end architecture;
