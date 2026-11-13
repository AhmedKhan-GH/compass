library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity top_module is
    port (
        clk : in std_logic;
        sync_reset : in std_logic;
        async_reset : in std_logic;
        data : in std_logic_vector(3 downto 0);
        sync_value : out std_logic_vector(3 downto 0);
        async_value : out std_logic_vector(3 downto 0)
    );
end entity;

architecture rtl of top_module is
begin
    -- Task 1. Reset on a clock edge: implement this requirement.
    -- Task 2. Reset without waiting for the clock: implement this requirement.
    sync_value <= (others => '0');
    async_value <= (others => '0');
end architecture;
