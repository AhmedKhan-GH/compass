library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port (
    temperature : in std_logic_vector(7 downto 0);
    limit : in std_logic_vector(7 downto 0);
    below_limit : out std_logic;
    extended : out std_logic_vector(11 downto 0);
    negative : out std_logic
    );
end entity;
architecture rtl of top_module is
    begin
    -- Task 1. Compare signed temperatures: implement this requirement.
    -- Task 2. Sign-extend the reading: implement this requirement.
    below_limit <= '0';
    extended <= (others => '0');
    negative <= '0';
end architecture;
