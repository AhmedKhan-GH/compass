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
    process(clk) begin if rising_edge(clk) then if reset='1' then value<=(others=>'0'); elsif load='1' and freeze='0' then value<=data; end if; end if; end process;
end architecture;
