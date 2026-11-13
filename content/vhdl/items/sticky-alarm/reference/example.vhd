library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity top_module is
    port (
        clk : in std_logic;
        reset : in std_logic;
        fault : in std_logic;
        acknowledge : in std_logic;
        alarm : out std_logic
    );
end entity;

architecture rtl of top_module is
begin
    process(clk) begin if rising_edge(clk) then if reset='1' then alarm<='0'; elsif fault='1' then alarm<='1'; elsif acknowledge='1' then alarm<='0'; end if; end if; end process;
end architecture;
