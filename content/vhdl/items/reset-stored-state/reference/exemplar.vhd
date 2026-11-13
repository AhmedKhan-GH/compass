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
    process(clk) begin if rising_edge(clk) then if sync_reset='1' then sync_value<=(others=>'0'); else sync_value<=data; end if; end if; end process; process(clk,async_reset) begin if async_reset='1' then async_value<=(others=>'0'); elsif rising_edge(clk) then async_value<=data; end if; end process;
end architecture;
