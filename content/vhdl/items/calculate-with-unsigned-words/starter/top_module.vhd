library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port (
    a : in std_logic_vector(7 downto 0);
    b : in std_logic_vector(7 downto 0);
    sum : out std_logic_vector(7 downto 0);
    difference : out std_logic_vector(7 downto 0);
    a_less_b : out std_logic;
    equal : out std_logic
    );
end entity;
architecture rtl of top_module is
    begin
    -- Task 1. Calculate wrapping results: implement this requirement.
    -- Task 2. Compare the unsigned readings: implement this requirement.
    sum <= (others => '0');
    difference <= (others => '0');
    a_less_b <= '0';
    equal <= '0';
end architecture;
