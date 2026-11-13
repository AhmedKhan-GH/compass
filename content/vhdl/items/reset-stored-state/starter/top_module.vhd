library ieee;
use ieee.std_logic_1164.all;

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
    -- Task 1: Reset the first stored value on a clock edge.
    sync_value <= (others => '0');
    -- Task 2: Reset the second stored value without waiting for the clock.
    async_value <= (others => '0');
end architecture;
