library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port (
    clk : in std_logic;
    reset : in std_logic;
    load : in std_logic;
    freeze : in std_logic;
    data : in std_logic_vector(7 downto 0);
    value : out std_logic_vector(7 downto 0)
    );
end entity;
architecture rtl of top_module is
    begin
    -- Task 1. Load or hold a reading: implement this requirement.
    -- Task 2. Resolve conflicting controls: implement this requirement.
    value <= (others => '0');
end architecture;
