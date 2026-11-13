library ieee;
use ieee.std_logic_1164.all;
entity top_module is
    port (
    request : in std_logic;
    blocked : in std_logic;
    boost : in std_logic;
    fan_on : out std_logic;
    speed : out std_logic_vector(1 downto 0)
    );
end entity;
architecture rtl of top_module is
    begin
    -- Task 1. Decide whether the fan runs: implement this requirement.
    -- Task 2. Choose a complete speed: implement this requirement.
    fan_on <= '0';
    speed <= (others => '0');
end architecture;
