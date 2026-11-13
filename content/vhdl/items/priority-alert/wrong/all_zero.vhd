library ieee;
use ieee.std_logic_1164.all;

entity top_module is
    port (
        critical : in std_logic;
        warning : in std_logic;
        advisory : in std_logic;
        code : out std_logic_vector(1 downto 0);
        valid : out std_logic
    );
end entity;

architecture rtl of top_module is
begin
    -- TODO: implement the required behavior.
    code <= (others => '0');
    valid <= '0';
end architecture;
